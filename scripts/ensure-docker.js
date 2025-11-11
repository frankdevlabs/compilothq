#!/usr/bin/env node

/**
 * Ensure Docker Services Are Running
 *
 * This script intelligently manages Docker Compose services:
 * 1. Checks if Docker is available (using check-docker.js)
 * 2. Validates docker/.env exists
 * 3. Checks if services are already running
 * 4. Starts services if needed (idempotent)
 * 5. Waits for health checks to pass
 *
 * Safe to run multiple times - will skip if services are already healthy.
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { resolve, join } = require('path');
const { checkDocker, getDockerComposeCommand } = require('./check-docker');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`\n❌ ${message}`, 'red');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function dim(message) {
  log(`  ${message}`, 'dim');
}

// Project paths
const PROJECT_ROOT = resolve(__dirname, '..');
const DOCKER_DIR = join(PROJECT_ROOT, 'docker');
const COMPOSE_FILE = join(DOCKER_DIR, 'docker-compose.yml');
const ENV_FILE = join(DOCKER_DIR, '.env');
const ENV_EXAMPLE = join(DOCKER_DIR, '.env.example');

/**
 * Check if required files exist
 */
function validateEnvironment() {
  if (!existsSync(COMPOSE_FILE)) {
    error(`docker-compose.yml not found at: ${COMPOSE_FILE}`);
    process.exit(1);
  }

  if (!existsSync(ENV_FILE)) {
    error('docker/.env file not found');
    log('\nPlease create the environment file:', 'yellow');
    log(`  cp ${ENV_EXAMPLE} ${ENV_FILE}\n`);
    log('Then configure your Docker service settings.\n');
    process.exit(1);
  }
}

/**
 * Get container status for CompiloHQ services
 */
function getServiceStatus(composeCmd) {
  try {
    const output = execSync(
      `${composeCmd} -f "${COMPOSE_FILE}" ps --format json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    if (!output.trim()) {
      return [];
    }

    // Parse JSON output (each line is a JSON object)
    const lines = output.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (err) {
    return [];
  }
}

/**
 * Check if all required services are running and healthy
 */
function areServicesRunning(composeCmd) {
  const services = getServiceStatus(composeCmd);

  if (services.length === 0) {
    return false;
  }

  // Check for postgres and redis containers
  const postgres = services.find(s => s.Name === 'compilothq-postgres');
  const redis = services.find(s => s.Name === 'compilothq-redis');

  if (!postgres || !redis) {
    return false;
  }

  // Check if containers are running
  const postgresRunning = postgres.State === 'running';
  const redisRunning = redis.State === 'running';

  return postgresRunning && redisRunning;
}

/**
 * Start Docker Compose services
 */
function startServices(composeCmd) {
  log('\n🚀 Starting Docker services...', 'blue');
  dim('This may take a moment on first run...\n');

  try {
    execSync(
      `${composeCmd} -f "${COMPOSE_FILE}" up -d`,
      { stdio: 'inherit' }
    );
    success('Docker services started');
  } catch (err) {
    error('Failed to start Docker services');
    log('\nTry running manually to see detailed errors:', 'yellow');
    log(`  cd docker && ${composeCmd} up -d\n`);
    process.exit(1);
  }
}

/**
 * Wait for services to be healthy using wait-on
 */
async function waitForHealth() {
  log('\n⏳ Waiting for services to be healthy...', 'blue');

  // Read ports from docker/.env if available
  let postgresPort = '5432';
  let redisPort = '6379';

  try {
    const envContent = require('fs').readFileSync(ENV_FILE, 'utf8');
    const postgresMatch = envContent.match(/POSTGRES_PORT=(\d+)/);
    const redisMatch = envContent.match(/REDIS_PORT=(\d+)/);

    if (postgresMatch) postgresPort = postgresMatch[1];
    if (redisMatch) redisPort = redisMatch[1];
  } catch (err) {
    // Use defaults if can't read .env
  }

  const waitOn = require('wait-on');
  const opts = {
    resources: [
      `tcp:localhost:${postgresPort}`,
      `tcp:localhost:${redisPort}`,
    ],
    timeout: 60000, // 60 seconds
    interval: 1000, // Check every second
    verbose: false,
    log: false,
  };

  try {
    await waitOn(opts);
    success('All services are healthy and ready');
    dim(`  PostgreSQL: localhost:${postgresPort}`);
    dim(`  Redis: localhost:${redisPort}\n`);
  } catch (err) {
    error('Services failed to become healthy within 60 seconds');
    log('\nTroubleshooting steps:', 'yellow');
    log('  1. Check service logs: pnpm docker:logs');
    log('  2. Check service status: pnpm docker:ps');
    log('  3. Try resetting services: pnpm docker:reset\n');
    process.exit(1);
  }
}

/**
 * Main function
 */
async function ensureDocker() {
  // Step 1: Check Docker availability
  checkDocker();

  // Step 2: Get docker compose command
  const composeCmd = getDockerComposeCommand();

  // Step 3: Validate environment
  validateEnvironment();

  // Step 4: Check if services are already running
  if (areServicesRunning(composeCmd)) {
    success('Docker services are already running');
    dim('  Skipping startup...\n');
    return;
  }

  // Step 5: Start services
  startServices(composeCmd);

  // Step 6: Wait for health checks
  await waitForHealth();
}

// Run if called directly
if (require.main === module) {
  ensureDocker().catch(err => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { ensureDocker };
