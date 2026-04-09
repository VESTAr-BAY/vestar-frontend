import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')
const portalRoot = path.resolve(frontendRoot, '../vestar-verification-portal')
const portalPort = process.env.VERIFICATION_PORTAL_DEV_PORT ?? '4174'
const viteBinaryName = process.platform === 'win32' ? 'vite.cmd' : 'vite'

function viteBinaryPath(root) {
  return path.join(root, 'node_modules', '.bin', viteBinaryName)
}

function spawnVite({ cwd, args = [], env = process.env }) {
  return spawn(viteBinaryPath(cwd), args, {
    cwd,
    stdio: 'inherit',
    env,
  })
}

async function ensurePortalDependencies() {
  try {
    await access(path.join(portalRoot, 'node_modules'))
  } catch {
    throw new Error('vestar-verification-portal dependencies are missing. Install them first.')
  }

  try {
    await access(path.join(frontendRoot, 'node_modules'))
  } catch {
    throw new Error('vestar-frontend dependencies are missing. Install them first.')
  }
}

async function main() {
  await ensurePortalDependencies()

  const portalProcess = spawnVite({
    cwd: portalRoot,
    args: ['--host', '0.0.0.0', '--port', portalPort, '--strictPort', '--base', '/verification/'],
  })

  // sungje : 메인 프론트 dev 서버는 verification portal dev 서버를 같은 origin 아래로 프록시한다.
  const frontendProcess = spawnVite({
    cwd: frontendRoot,
    args: process.argv.slice(2),
    env: {
      ...process.env,
      VERIFICATION_PORTAL_DEV_PORT: portalPort,
    },
  })

  const terminateChildren = (signal = 'SIGTERM') => {
    if (!portalProcess.killed) portalProcess.kill(signal)
    if (!frontendProcess.killed) frontendProcess.kill(signal)
  }

  process.on('SIGINT', () => {
    terminateChildren('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    terminateChildren('SIGTERM')
    process.exit(0)
  })

  portalProcess.on('exit', (code) => {
    if (code && code !== 0) {
      frontendProcess.kill('SIGTERM')
      process.exit(code)
    }
  })

  frontendProcess.on('exit', (code) => {
    portalProcess.kill('SIGTERM')
    process.exit(code ?? 0)
  })
}

await main()
