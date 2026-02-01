import * as p from '@clack/prompts'
import pc from 'picocolors'
import { execSync, spawn } from 'child_process'
import { existsSync } from 'fs'
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
  try {
    const compose = require('fs').readFileSync(join(installDir, 'docker-compose.yml'), 'utf-8')
    const match = compose.match(/(\d+):3000/)
    return match ? parseInt(match[1], 10) : 3001
  } catch {
    return 3001
  }
}

async function status(): Promise<void> {
  const installDir = getInstallDir()
  const port = getPort()
  
  p.intro(pc.cyan('📊 Clawtrics Status'))
  
  try {
    const output = runCommand('docker compose ps --format json', installDir)
    const containers = output.split('\n').filter(Boolean).map(line => JSON.parse(line))
    
    if (containers.length === 0) {
      p.log.warn(pc.yellow('Container not running'))
    } else {
      for (const container of containers) {
        const state = container.State || container.Status
        const color = state === 'running' ? pc.green : pc.red
        p.log.info(`${color('●')} ${container.Name || container.Service}: ${state}`)
      }
    }
    
    p.log.info('')
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
    
  } catch (err) {
    p.log.error('Failed to get status')
    throw err
  }
  
  p.outro('')
}

async function start(): Promise<void> {
  const installDir = getInstallDir()
  const port = getPort()
  
  p.intro(pc.cyan('📊 Starting Clawtrics'))
  
  const spinner = p.spinner()
  spinner.start('Starting container...')
  
  try {
    await runCommandLive('docker', ['compose', 'up', '-d'], installDir)
    spinner.stop('Container started')
    
    p.log.info('')
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
    
  } catch (err) {
    spinner.stop('Failed to start')
    throw err
  }
  
  p.outro(pc.green('✓ Running'))
}

async function stop(): Promise<void> {
  const installDir = getInstallDir()
  
  p.intro(pc.cyan('📊 Stopping Clawtrics'))
  
  const spinner = p.spinner()
  spinner.start('Stopping container...')
  
  try {
    await runCommandLive('docker', ['compose', 'down'], installDir)
    spinner.stop('Container stopped')
  } catch (err) {
    spinner.stop('Failed to stop')
    throw err
  }
  
  p.outro(pc.green('✓ Stopped'))
}

async function restart(): Promise<void> {
  const installDir = getInstallDir()
  const port = getPort()
  
  p.intro(pc.cyan('📊 Restarting Clawtrics'))
  
  const spinner = p.spinner()
  spinner.start('Restarting container...')
  
  try {
    await runCommandLive('docker', ['compose', 'restart'], installDir)
    spinner.stop('Container restarted')
    
    p.log.info('')
    p.log.info(`Dashboard: ${pc.cyan(`http://localhost:${port}`)}`)
    
  } catch (err) {
    spinner.stop('Failed to restart')
    throw err
  }
  
  p.outro(pc.green('✓ Running'))
}

async function logs(): Promise<void> {
  const installDir = getInstallDir()
  
  p.intro(pc.cyan('📊 Clawtrics Logs'))
  p.log.info(pc.dim('Press Ctrl+C to exit\n'))
  
  await runCommandLive('docker', ['compose', 'logs', '-f', '--tail=50'], installDir)
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
  
  const spinner = p.spinner()
  
  try {
    spinner.start('Pulling latest changes...')
    await runCommandLive('git', ['pull', 'origin', 'main'], installDir)
    spinner.stop('Code updated')
    
    spinner.start('Rebuilding Docker image...')
    await runCommandLive('docker', ['compose', 'up', '-d', '--build'], installDir)
    spinner.stop('Container rebuilt')
    
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
  ${pc.cyan('logs')}      View container logs
  ${pc.cyan('open')}      Open in browser
  ${pc.cyan('update')}    Pull latest & rebuild
`)
      break
  }
}
