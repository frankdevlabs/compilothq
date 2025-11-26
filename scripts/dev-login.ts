#!/usr/bin/env tsx

/**
 * Development Login CLI
 *
 * Generates a valid session token for a development user persona.
 * Outputs multiple formats for different use cases:
 * - Raw token (for Postman/curl)
 * - Cookie string (for browser dev tools)
 * - JSON (for programmatic use)
 *
 * Usage:
 *   pnpm dev:login --persona=DPO
 *   pnpm dev:login --persona=PRIVACY_OFFICER
 *   pnpm dev:login --persona=BUSINESS_OWNER --format=json
 *
 * SECURITY: Only works in development/test (NODE_ENV check)
 */

import {
  createDevSession,
  getValidDevPersonas,
  type Session,
  type UserPersona,
} from '../packages/database/src/index'

interface Options {
  persona: string | null
  format: 'all' | 'token' | 'cookie' | 'json'
}

interface SessionResult {
  session: Session
  user: {
    id: string
    name: string
    email: string
    organizationId: string
    primaryPersona: UserPersona
  }
  token: string
}

// Parse command-line arguments
function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {
    persona: null,
    format: 'all',
  }

  for (const arg of args) {
    if (arg.startsWith('--persona=')) {
      options.persona = arg.split('=')[1] ?? null
    } else if (arg.startsWith('--format=')) {
      const format = arg.split('=')[1]
      if (format === 'all' || format === 'token' || format === 'cookie' || format === 'json') {
        options.format = format
      }
    } else if (arg === '--help' || arg === '-h') {
      showHelp()
      process.exit(0)
    }
  }

  return options
}

function showHelp(): void {
  console.log(`
🔐 Compilo Development Login
Generate authentication sessions for local development

USAGE:
  pnpm dev:login --persona=<PERSONA> [--format=<FORMAT>]

PERSONAS:
  DPO                - Data Protection Officer
  PRIVACY_OFFICER    - Privacy Manager/Officer
  BUSINESS_OWNER     - Business stakeholder
  IT_ADMIN           - IT Manager/System Administrator
  SECURITY_TEAM      - Information Security Officer
  LEGAL_TEAM         - Legal Counsel

FORMATS:
  all      - Show all formats (default)
  token    - Raw session token only
  cookie   - Cookie string only
  json     - JSON output

EXAMPLES:
  # Browser testing (copy cookie to DevTools)
  pnpm dev:login --persona=DPO

  # API testing with curl
  pnpm dev:login --persona=DPO --format=cookie

  # Programmatic use
  pnpm dev:login --persona=DPO --format=json

USE CASES:
  1. Browser Development (localhost:3000)
     - Run command and copy "Set-Cookie" header
     - Open Chrome DevTools → Application → Cookies
     - Create new cookie with the values shown
     - Refresh page - you're logged in!

  2. Playwright E2E Tests
     - Use the helper: await setAuthCookie(page, 'DPO')
     - See apps/web/__tests__/e2e/helpers/dev-auth.ts

  3. Manual API Testing (Postman/curl)
     - Copy the "Cookie" header value
     - Add to request headers:
       Cookie: authjs.session-token=<token>

  4. Claude Code Validation
     - Generate session, set cookie in browser
     - Take screenshots of protected features
     - Validate UI/UX with authentication context
`)
}

function formatOutput(result: SessionResult, format: string): void {
  const { session, user, token } = result
  const cookieName =
    process.env['NODE_ENV'] === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

  const cookieValue = `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax${process.env['NODE_ENV'] === 'production' ? '; Secure' : ''}`

  if (format === 'token') {
    console.log(token)
    return
  }

  if (format === 'cookie') {
    console.log(cookieValue)
    return
  }

  if (format === 'json') {
    console.log(
      JSON.stringify(
        {
          token,
          cookieName,
          cookieValue,
          user,
          expires: session.expires.toISOString(),
        },
        null,
        2
      )
    )
    return
  }

  // Default: all formats
  console.log('')
  console.log('✅ Development session created successfully!')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 USER INFORMATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Name:         ${user.name}`)
  console.log(`Email:        ${user.email}`)
  console.log(`Persona:      ${user.primaryPersona}`)
  console.log(`Organization: Compilo Dev (${user.organizationId})`)
  console.log(`Expires:      ${session.expires.toLocaleString()} (30 days)`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🍪 BROWSER SETUP (Chrome DevTools)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1. Open http://localhost:3000')
  console.log('2. Open DevTools → Application → Cookies → http://localhost:3000')
  console.log('3. Create new cookie with these values:')
  console.log('')
  console.log(`   Name:     ${cookieName}`)
  console.log(`   Value:    ${token}`)
  console.log(`   Path:     /`)
  console.log(`   HttpOnly: ✓`)
  console.log(`   SameSite: Lax`)
  console.log('')
  console.log("4. Refresh page - you're logged in!")
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📡 API TESTING (Postman/curl)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Add this header to your requests:')
  console.log('')
  console.log(`   Cookie: ${cookieName}=${token}`)
  console.log('')
  console.log('Example curl command:')
  console.log('')
  console.log(`   curl http://localhost:3000/api/trpc/user.me \\`)
  console.log(`     -H "Cookie: ${cookieName}=${token}"`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 RAW VALUES (for copy-paste)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Session Token: ${token}`)
  console.log('')
  console.log(`Set-Cookie Header:`)
  console.log(`${cookieValue}`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

async function main(): Promise<void> {
  try {
    const options = parseArgs()

    // Validate persona argument
    if (!options.persona) {
      console.error('❌ Error: --persona argument is required')
      console.log('')
      console.log('Valid personas:')
      getValidDevPersonas().forEach((p) => console.log(`  - ${p}`))
      console.log('')
      console.log('Run "pnpm dev:login --help" for usage information')
      process.exit(1)
    }

    // Validate persona value
    const validPersonas = getValidDevPersonas()
    if (!validPersonas.includes(options.persona as UserPersona)) {
      console.error(`❌ Error: Invalid persona "${options.persona}"`)
      console.log('')
      console.log('Valid personas:')
      validPersonas.forEach((p) => console.log(`  - ${p}`))
      process.exit(1)
    }

    // Create session
    const result = await createDevSession(options.persona as UserPersona)

    // Format and display output
    formatOutput(result, options.format)

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Failed to create development session')
    console.error('')
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    console.error('')

    if (error instanceof Error && error.message.includes('Development user not found')) {
      console.error('💡 Solution: Run "pnpm db:seed" to create development users')
    } else if (error instanceof Error && error.message.includes('production')) {
      console.error(
        '💡 This command only works in development (NODE_ENV=development or NODE_ENV=test)'
      )
    }

    console.error('')
    process.exit(1)
  }
}

main()
