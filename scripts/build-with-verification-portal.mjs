import { spawnSync } from 'node:child_process'
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, '..')
const portalRoot = path.resolve(frontendRoot, '../vestar-verification-portal')
const frontendDistDir = path.join(frontendRoot, 'dist')
const frontendBaseDir = path.join(frontendDistDir, 'vote')
const portalDistDir = path.join(portalRoot, 'dist')
const embeddedPortalDir = path.join(frontendBaseDir, 'verification')
const redirectsPath = path.join(frontendDistDir, '_redirects')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const FRONTEND_DIST_SKIP = new Set(['vote'])

export const PORTAL_REDIRECT_RULE = '/vote/verification/* /vote/verification/index.html  200'
export const SPA_REDIRECT_RULE = '/vote/*  /vote/index.html  200'

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
    runCommand(pnpmCommand, ['ci'], portalRoot)
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

/**
 * Writes redirect rules to a Netlify _redirects file.
 * Ensures pinned rules appear first and are never duplicated.
 *
 * @param {string} filePath - Absolute path to the _redirects file
 * @param {string[]} pinnedRules - Rules that must appear at the top (in order)
 */
export async function syncRedirects(filePath, pinnedRules) {
  let content = ''

  try {
    content = await readFile(filePath, 'utf8')
  } catch {
    content = ''
  }

  const pinnedSet = new Set(pinnedRules)
  const preserved = content
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !pinnedSet.has(line))

  const nextLines = [...pinnedRules, ...preserved]

  await writeFile(filePath, `${nextLines.join('\n')}\n`)
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
  runCommand(pnpmCommand, ['run', 'build:app'], frontendRoot)

  // Always mirror the app under /vote/ so asset paths (/vote/assets/...) resolve correctly on Netlify
  await mirrorFrontendBuildUnderVoteBase()
  await syncRedirects(redirectsPath, [PORTAL_REDIRECT_RULE, SPA_REDIRECT_RULE])

  if (!(await hasPortal())) {
    console.log('Skipping verification portal build (vestar-verification-portal not found).')
    return
  }

  await ensurePortalDependencies()
  await rm(portalDistDir, { recursive: true, force: true })
  runCommand(pnpmCommand, ['run', 'build', '--', '--base=/vote/verification/'], portalRoot)

  await rm(embeddedPortalDir, { recursive: true, force: true })
  await mkdir(path.dirname(embeddedPortalDir), { recursive: true })
  await cp(portalDistDir, embeddedPortalDir, { recursive: true, force: true })

  console.log(`Embedded verification portal into ${embeddedPortalDir}`)
}

// Only run when executed directly (not imported by tests)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
