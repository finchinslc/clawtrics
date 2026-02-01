import * as p from '@clack/prompts'
import pc from 'picocolors'
import { execSync, spawn } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const REPO_URL = 'https://github.com/finchinslc/clawtrics.git'
const DEFAULT_PORT = 3001
const DEFAULT_INSTALL_DIR = join(homedir(), 'clawtrics')

interface InstallerConfig {
  installDir: string
  port: number
  autoStart: boolean
}

interface ExistingInstall {
  installDir: string
  port: number
  hasLaunchAgent: boolean
}

function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

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

function detectExistingInstall(): ExistingInstall | null {
  const installDir = DEFAULT_INSTALL_DIR
  const composePath = join(installDir, 'docker-compose.yml')
  const plistPath = join(homedir(), 'Library', 'LaunchAgents', 'com.clawtrics.dashboard.plist')
  
  if (!existsSync(installDir) || !existsSync(composePath)) {
    return null
  }
  
  // Parse port from docker-compose.yml
  let port = DEFAULT_PORT
  try {
    const composeContent = readFileSync(composePath, 'utf-8')
    const portMatch = composeContent.match(/(\d+):3000/)
    if (portMatch) {
      port = parseInt(portMatch[1], 10)
    }
  } catch {
    // Use default
  }
  
  return {
    installDir,
    port,
    hasLaunchAgent: existsSync(plistPath),
  }
}

async function checkPrerequisites(): Promise<{ ok: boolean; missing: string[] }> {
  const missing: string[] = []
  
  // Check Docker
  if (!commandExists('docker')) {
    missing.push('docker')
  } else {
    // Check if Docker is running
    try {
      runCommand('docker info')
    } catch {
      missing.push('docker (not running)')
    }
  }
  
  // Check git
  if (!commandExists('git')) {
    missing.push('git')
  }
  
  return { ok: missing.length === 0, missing }
}

async function runUpdate(existing: ExistingInstall): Promise<void> {
  const spinner = p.spinner()
  
  try {
    spinner.start('Pulling latest changes...')
    await runCommandLive('git', ['pull', 'origin', 'main'], existing.installDir)
    spinner.stop('Code updated')
    
    spinner.start('Rebuilding Docker image...')
    await runCommandLive('docker', ['compose', 'up', '-d', '--build'], existing.installDir)
    spinner.stop('Container rebuilt and running')
    
    p.log.success(pc.green('Update complete!'))
    p.log.info('')
    p.log.info(`Dashboard running at: ${pc.cyan(`http://localhost:${existing.port}`)}`)
    
    p.outro(pc.green('✓ Clawtrics updated'))
    
  } catch (err) {
    spinner.stop('Update failed')
    throw err
  }
}

async function cloneAndSetup(config: InstallerConfig, spinner: ReturnType<typeof p.spinner>): Promise<void> {
  const { installDir, port } = config
  
  spinner.message('Cloning Clawtrics...')
  await runCommandLive('git', ['clone', REPO_URL, installDir])
  
  // Update port in docker-compose.yml if not default
  if (port !== 3000) {
    spinner.message('Configuring port...')
    const composePath = join(installDir, 'docker-compose.yml')
    let compose = readFileSync(composePath, 'utf-8')
    compose = compose.replace(/3001:3000/, `${port}:3000`)
    writeFileSync(composePath, compose)
  }
  
  spinner.message('Building Docker image (this may take a minute)...')
  await runCommandLive('docker', ['compose', 'up', '-d', '--build'], installDir)
}

async function setupLaunchAgent(config: InstallerConfig, spinner: ReturnType<typeof p.spinner>): Promise<void> {
  if (process.platform !== 'darwin') {
    p.log.warn('Auto-start is only supported on macOS')
    return
  }
  
  const { installDir } = config
  const launchAgentsDir = join(homedir(), 'Library', 'LaunchAgents')
  const plistPath = join(launchAgentsDir, 'com.clawtrics.dashboard.plist')
  
  mkdirSync(launchAgentsDir, { recursive: true })
  
  const dockerPath = runCommand('which docker')
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clawtrics.dashboard</string>
    <key>ProgramArguments</key>
    <array>
        <string>${dockerPath}</string>
        <string>compose</string>
        <string>up</string>
        <string>-d</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${installDir}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${installDir}/logs/launchd-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${installDir}/logs/launchd-stderr.log</string>
</dict>
</plist>`

  mkdirSync(join(installDir, 'logs'), { recursive: true })
  writeFileSync(plistPath, plistContent)
  
  spinner.message('Loading launch agent...')
  try {
    runCommand(`launchctl unload ${plistPath}`)
  } catch {
    // Ignore if not loaded
  }
  runCommand(`launchctl load ${plistPath}`)
}

export async function runInstaller(): Promise<void> {
  console.clear()
  
  p.intro(pc.cyan(pc.bold('📊 Clawtrics Installer')))
  
  // Check for existing installation first
  const existing = detectExistingInstall()
  
  if (existing) {
    p.log.info(pc.green('✓ Existing installation detected'))
    p.log.info(`  Directory: ${pc.cyan(existing.installDir)}`)
    p.log.info(`  Port: ${pc.cyan(String(existing.port))}`)
    p.log.info(`  Auto-start: ${pc.cyan(existing.hasLaunchAgent ? 'Yes' : 'No')}`)
    p.log.info('')
    
    const action = await p.select({
      message: 'What would you like to do?',
      options: [
        { value: 'update', label: 'Update', hint: 'Pull latest code and rebuild' },
        { value: 'fresh', label: 'Fresh Install', hint: 'Remove and reinstall from scratch' },
        { value: 'cancel', label: 'Cancel' },
      ],
    })
    
    if (p.isCancel(action) || action === 'cancel') {
      p.outro(pc.yellow('Cancelled.'))
      process.exit(0)
    }
    
    if (action === 'update') {
      await runUpdate(existing)
      process.exit(0)
    }
    
    // Fresh install - confirm deletion
    const confirmDelete = await p.confirm({
      message: `This will delete ${existing.installDir}. Continue?`,
      initialValue: false,
    })
    
    if (p.isCancel(confirmDelete) || !confirmDelete) {
      p.outro(pc.yellow('Cancelled.'))
      process.exit(0)
    }
    
    // Stop and remove existing
    const rmSpinner = p.spinner()
    rmSpinner.start('Removing existing installation...')
    try {
      await runCommandLive('docker', ['compose', 'down', '-v'], existing.installDir)
    } catch {
      // Ignore errors
    }
    await runCommandLive('rm', ['-rf', existing.installDir])
    rmSpinner.stop('Removed')
  }
  
  // Check prerequisites
  const prereqSpinner = p.spinner()
  prereqSpinner.start('Checking prerequisites...')
  
  const { ok, missing } = await checkPrerequisites()
  
  if (!ok) {
    prereqSpinner.stop('Prerequisites check failed')
    
    for (const dep of missing) {
      if (dep === 'docker') {
        p.log.error(pc.red('Docker is not installed.'))
        p.log.info(`Install Docker Desktop: ${pc.cyan('https://docker.com/products/docker-desktop')}`)
      } else if (dep === 'docker (not running)') {
        p.log.error(pc.red('Docker is installed but not running.'))
        p.log.info('Please start Docker Desktop and try again.')
      } else if (dep === 'git') {
        p.log.error(pc.red('Git is not installed.'))
        p.log.info(`Install Git: ${pc.cyan('https://git-scm.com')}`)
      }
    }
    
    p.outro(pc.red('Please install missing dependencies and try again.'))
    process.exit(1)
  }
  
  prereqSpinner.stop('Prerequisites OK')
  
  // Configuration prompts
  const installDir = await p.text({
    message: 'Installation directory',
    initialValue: DEFAULT_INSTALL_DIR,
    validate: (value) => {
      if (!value) return 'Directory is required'
      if (existsSync(value)) return 'Directory already exists'
      return undefined
    },
  })
  
  if (p.isCancel(installDir)) {
    p.outro(pc.yellow('Installation cancelled.'))
    process.exit(0)
  }
  
  const portInput = await p.text({
    message: 'Port number',
    initialValue: String(DEFAULT_PORT),
    validate: (value) => {
      const num = parseInt(value, 10)
      if (isNaN(num) || num < 1 || num > 65535) {
        return 'Please enter a valid port (1-65535)'
      }
      return undefined
    },
  })
  
  if (p.isCancel(portInput)) {
    p.outro(pc.yellow('Installation cancelled.'))
    process.exit(0)
  }
  
  const autoStart = await p.confirm({
    message: 'Start automatically on boot? (macOS only)',
    initialValue: process.platform === 'darwin',
  })
  
  if (p.isCancel(autoStart)) {
    p.outro(pc.yellow('Installation cancelled.'))
    process.exit(0)
  }
  
  const config: InstallerConfig = {
    installDir: installDir as string,
    port: parseInt(portInput as string, 10),
    autoStart: autoStart as boolean,
  }
  
  // Confirm
  p.log.info('')
  p.log.info(pc.bold('Configuration:'))
  p.log.info(`  Directory: ${pc.cyan(config.installDir)}`)
  p.log.info(`  Port: ${pc.cyan(String(config.port))}`)
  p.log.info(`  Auto-start: ${pc.cyan(config.autoStart ? 'Yes' : 'No')}`)
  p.log.info('')
  
  const proceed = await p.confirm({
    message: 'Proceed with installation?',
    initialValue: true,
  })
  
  if (p.isCancel(proceed) || !proceed) {
    p.outro(pc.yellow('Installation cancelled.'))
    process.exit(0)
  }
  
  // Run installation
  const installSpinner = p.spinner()
  installSpinner.start('Installing Clawtrics...')
  
  try {
    await cloneAndSetup(config, installSpinner)
    installSpinner.stop('Clawtrics installed')
    
    if (config.autoStart) {
      const launchSpinner = p.spinner()
      launchSpinner.start('Setting up auto-start...')
      await setupLaunchAgent(config, launchSpinner)
      launchSpinner.stop('Auto-start configured')
    }
    
    p.log.success(pc.green('Installation complete!'))
    p.log.info('')
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${config.port}`)}`)
    p.log.info('')
    p.log.info(pc.bold('Manage with:'))
    p.log.info(`  ${pc.cyan('npx clawtrics-installer status')}`)
    p.log.info(`  ${pc.cyan('npx clawtrics-installer stop')}`)
    p.log.info(`  ${pc.cyan('npx clawtrics-installer start')}`)
    p.log.info(`  ${pc.cyan('npx clawtrics-installer logs')}`)
    
    p.outro(pc.green('Happy metrics! 📊'))
    
  } catch (err) {
    installSpinner.stop('Installation failed')
    throw err
  }
}
