import { spawnSync } from 'node:child_process'
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')
const portalRoot = path.resolve(frontendRoot, '../vestar-verification-portal')
const frontendDistDir = path.join(frontendRoot, 'dist')
const frontendBaseDir = path.join(frontendDistDir, 'vote')
const portalDistDir = path.join(portalRoot, 'dist')
const embeddedPortalDir = path.join(frontendBaseDir, 'verification')
const redirectsPath = path.join(frontendDistDir, '_redirects')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const FRONTEND_DIST_SKIP = new Set(['vote'])
const PORTAL_REDIRECT_RULE = '/vote/verification/* /vote/verification/index.html  200'

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

async function ensurePortalDependencies() {
  try {
    await access(path.join(portalRoot, 'node_modules'))
  } catch {
    runCommand(npmCommand, ['ci'], portalRoot)
  }
}

async function mirrorFrontendBuildUnderVoteBase() {
  await rm(frontendBaseDir, { recursive: true, force: true })
  await mkdir(frontendBaseDir, { recursive: true })

  const entries = await readdir(frontendDistDir, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => !FRONTEND_DIST_SKIP.has(entry.name))
      .map((entry) =>
        cp(path.join(frontendDistDir, entry.name), path.join(frontendBaseDir, entry.name), {
          recursive: true,
          force: true,
        }),
      ),
  )
}

async function syncRedirects() {
  let content = ''

  try {
    content = await readFile(redirectsPath, 'utf8')
  } catch {
    content = ''
  }

  const lines = content.split(/\r?\n/).filter(Boolean)
  const nextLines = [PORTAL_REDIRECT_RULE, ...lines.filter((line) => line !== PORTAL_REDIRECT_RULE)]

  await writeFile(redirectsPath, `${nextLines.join('\n')}\n`)
}

async function hasPortal() {
  try {
    await access(portalRoot)
    return true
  } catch {
    return false
  }
}

async function main() {
  runCommand(npmCommand, ['run', 'build:app'], frontendRoot)

  if (!(await hasPortal())) {
    console.log('Skipping verification portal build (vestar-verification-portal not found).')
    return
  }

  await mirrorFrontendBuildUnderVoteBase()

  await ensurePortalDependencies()
  await rm(portalDistDir, { recursive: true, force: true })
  runCommand(npmCommand, ['run', 'build', '--', '--base=/vote/verification/'], portalRoot)

  await rm(embeddedPortalDir, { recursive: true, force: true })
  await mkdir(path.dirname(embeddedPortalDir), { recursive: true })
  await cp(portalDistDir, embeddedPortalDir, { recursive: true, force: true })

  await syncRedirects()

  console.log(`Embedded verification portal into ${embeddedPortalDir}`)
}

await main()
