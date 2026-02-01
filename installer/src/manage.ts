import * as p from '@clack/prompts'
import pc from 'picocolors'
import { execSync, spawn, ChildProcess } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const DEFAULT_INSTALL_DIR = join(homedir(), 'clawtrics')

function runCommand(cmd: string, cwd?: string): string {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim()
}

function runCommandLive(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: 'inherit' })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with code ${code}`))
    })
    proc.on('error', reject)
  })
}

function getInstallDir(): string {
  if (existsSync(DEFAULT_INSTALL_DIR)) {
    return DEFAULT_INSTALL_DIR
  }
  throw new Error(`Clawtrics not found at ${DEFAULT_INSTALL_DIR}. Run the installer first.`)
}

function getPort(): number {
  const installDir = getInstallDir()
  const envPath = join(installDir, '.env.local')
  try {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      const match = content.match(/PORT=(\d+)/)
      if (match) return parseInt(match[1], 10)
    }
  } catch {
    // Use default
  }
  return 3001
}

function getPlistPath(): string {
  return join(homedir(), 'Library', 'LaunchAgents', 'com.clawtrics.dashboard.plist')
}

function isServiceRunning(): boolean {
  if (process.platform !== 'darwin') return false
  
  try {
    const output = runCommand('launchctl list | grep com.clawtrics.dashboard || true')
    return output.includes('com.clawtrics.dashboard')
  } catch {
    return false
  }
}

function isProcessRunning(): boolean {
  try {
    const port = getPort()
    runCommand(`lsof -i :${port} -t`)
    return true
  } catch {
    return false
  }
}

async function status(): Promise<void> {
  const installDir = getInstallDir()
  const port = getPort()
  const plistPath = getPlistPath()
  
  p.intro(pc.cyan('📊 Clawtrics Status'))
  
  const hasLaunchAgent = existsSync(plistPath)
  const serviceRunning = isServiceRunning()
  const processRunning = isProcessRunning()
  
  if (processRunning) {
    p.log.info(`${pc.green('●')} Dashboard is running`)
  } else {
    p.log.info(`${pc.red('●')} Dashboard is not running`)
  }
  
  p.log.info('')
  p.log.info(`  Directory:  ${pc.cyan(installDir)}`)
  p.log.info(`  Port:       ${pc.cyan(String(port))}`)
  p.log.info(`  Auto-start: ${pc.cyan(hasLaunchAgent ? 'Yes' : 'No')}`)
  
  if (processRunning) {
    p.log.info('')
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
  }
  
  p.outro('')
}

async function start(): Promise<void> {
  const installDir = getInstallDir()
  const port = getPort()
  const plistPath = getPlistPath()
  
  p.intro(pc.cyan('📊 Starting Clawtrics'))
  
  if (isProcessRunning()) {
    p.log.info(pc.yellow('Dashboard is already running'))
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
    p.outro('')
    return
  }
  
  const spinner = p.spinner()
  
  // If we have a launch agent, use launchctl
  if (existsSync(plistPath)) {
    spinner.start('Starting service...')
    try {
      runCommand(`launchctl kickstart -k gui/$(id -u)/com.clawtrics.dashboard`)
    } catch {
      // Try load if kickstart fails
      try {
        runCommand(`launchctl load ${plistPath}`)
      } catch {
        // Already loaded, just start
        runCommand(`launchctl start com.clawtrics.dashboard`)
      }
    }
    spinner.stop('Service started')
  } else {
    // Start in background with nohup
    spinner.start('Starting dashboard...')
    const logFile = join(installDir, 'logs', 'stdout.log')
    const errFile = join(installDir, 'logs', 'stderr.log')
    
    // Ensure logs dir exists
    try {
      runCommand(`mkdir -p ${join(installDir, 'logs')}`)
    } catch {
      // Ignore
    }
    
    const child = spawn('npm', ['start'], {
      cwd: installDir,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      env: { ...process.env, PORT: String(port) },
    })
    child.unref()
    
    // Wait a moment for it to start
    await new Promise(resolve => setTimeout(resolve, 2000))
    spinner.stop('Dashboard started')
  }
  
  p.log.info('')
  p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
  
  p.outro(pc.green('✓ Running'))
}

async function stop(): Promise<void> {
  const port = getPort()
  const plistPath = getPlistPath()
  
  p.intro(pc.cyan('📊 Stopping Clawtrics'))
  
  const spinner = p.spinner()
  spinner.start('Stopping dashboard...')
  
  // If we have a launch agent, unload it
  if (existsSync(plistPath) && isServiceRunning()) {
    try {
      runCommand(`launchctl unload ${plistPath}`)
    } catch {
      // Ignore
    }
  }
  
  // Kill any process on the port
  try {
    const pids = runCommand(`lsof -i :${port} -t`).split('\n').filter(Boolean)
    for (const pid of pids) {
      try {
        runCommand(`kill ${pid}`)
      } catch {
        // Ignore
      }
    }
  } catch {
    // No process running
  }
  
  spinner.stop('Dashboard stopped')
  p.outro(pc.green('✓ Stopped'))
}

async function restart(): Promise<void> {
  p.intro(pc.cyan('📊 Restarting Clawtrics'))
  
  const port = getPort()
  const plistPath = getPlistPath()
  
  const spinner = p.spinner()
  spinner.start('Restarting...')
  
  if (existsSync(plistPath)) {
    try {
      runCommand(`launchctl kickstart -k gui/$(id -u)/com.clawtrics.dashboard`)
      spinner.stop('Service restarted')
    } catch {
      spinner.stop('Restart failed, trying stop/start...')
      await stop()
      await start()
      return
    }
  } else {
    spinner.stop('')
    await stop()
    await start()
    return
  }
  
  p.log.info('')
  p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
  
  p.outro(pc.green('✓ Running'))
}

async function logs(): Promise<void> {
  const installDir = getInstallDir()
  const logFile = join(installDir, 'logs', 'stdout.log')
  
  p.intro(pc.cyan('📊 Clawtrics Logs'))
  
  if (!existsSync(logFile)) {
    p.log.warn('No log file found')
    p.outro('')
    return
  }
  
  p.log.info(pc.dim('Press Ctrl+C to exit\n'))
  
  await runCommandLive('tail', ['-f', '-n', '50', logFile])
}

async function open(): Promise<void> {
  const port = getPort()
  const url = `http://localhost:${port}`
  
  p.intro(pc.cyan('📊 Opening Clawtrics'))
  
  try {
    if (process.platform === 'darwin') {
      runCommand(`open ${url}`)
    } else if (process.platform === 'linux') {
      runCommand(`xdg-open ${url}`)
    } else {
      p.log.info(`Open in browser: ${pc.cyan(url)}`)
      p.outro('')
      return
    }
    p.log.success(`Opened ${pc.cyan(url)}`)
  } catch {
    p.log.info(`Open in browser: ${pc.cyan(url)}`)
  }
  
  p.outro('')
}

async function update(): Promise<void> {
  const installDir = getInstallDir()
  const port = getPort()
  
  p.intro(pc.cyan('📊 Updating Clawtrics'))
  
  const wasRunning = isProcessRunning()
  
  if (wasRunning) {
    const stopSpinner = p.spinner()
    stopSpinner.start('Stopping dashboard...')
    await stop()
    stopSpinner.stop('Stopped')
  }
  
  const spinner = p.spinner()
  
  try {
    spinner.start('Pulling latest changes...')
    await runCommandLive('git', ['pull', 'origin', 'main'], installDir)
    spinner.stop('Code updated')
    
    spinner.start('Installing dependencies...')
    await runCommandLive('npm', ['install'], installDir)
    spinner.stop('Dependencies installed')
    
    spinner.start('Building...')
    await runCommandLive('npm', ['run', 'build'], installDir)
    spinner.stop('Build complete')
    
    if (wasRunning) {
      const startSpinner = p.spinner()
      startSpinner.start('Starting dashboard...')
      await start()
      startSpinner.stop('Started')
    }
    
    p.log.success(pc.green('Update complete!'))
    p.log.info('')
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
    
  } catch (err) {
    spinner.stop('Update failed')
    throw err
  }
  
  p.outro(pc.green('✓ Updated'))
}

export async function runManage(command: string): Promise<void> {
  switch (command) {
    case 'status':
      await status()
      break
    case 'start':
      await start()
      break
    case 'stop':
      await stop()
      break
    case 'restart':
      await restart()
      break
    case 'logs':
      await logs()
      break
    case 'open':
      await open()
      break
    case 'update':
      await update()
      break
    default:
      console.log(`
${pc.cyan(pc.bold('📊 Clawtrics'))}

Usage: npx clawtrics-installer [command]

Commands:
  ${pc.cyan('install')}   Install Clawtrics (default)
  ${pc.cyan('status')}    Check if running
  ${pc.cyan('start')}     Start the dashboard
  ${pc.cyan('stop')}      Stop the dashboard
  ${pc.cyan('restart')}   Restart the dashboard
  ${pc.cyan('logs')}      View logs
  ${pc.cyan('open')}      Open in browser
  ${pc.cyan('update')}    Pull latest & rebuild
`)
      break
  }
}
