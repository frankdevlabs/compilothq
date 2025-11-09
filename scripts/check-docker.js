#!/usr/bin/env node

/**
 * Check Docker Availability
 *
 * This script checks if:
 * 1. Docker is installed
 * 2. Docker daemon is running
 * 3. Docker Compose command is available
 *
 * Exits with code 0 if Docker is ready, code 1 otherwise.
 */

const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

/**
 * Execute a command and return true if successful
 */
function canExecute(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect which docker compose command is available
 */
function getDockerComposeCommand() {
  // Try new 'docker compose' first (Docker Desktop / Docker Compose v2)
  if (canExecute('docker compose version')) {
    return 'docker compose';
  }

  // Fallback to old 'docker-compose' (standalone)
  if (canExecute('docker-compose version')) {
    return 'docker-compose';
  }

  return null;
}

/**
 * Check if Docker daemon is running
 */
function isDockerRunning() {
  return canExecute('docker ps');
}

/**
 * Main check function
 */
function checkDocker() {
  log('\n🔍 Checking Docker availability...\n', 'blue');

  // Check 1: Docker installed
  if (!canExecute('docker --version')) {
    error('Docker is not installed');
    log('\nPlease install Docker Desktop:', 'yellow');
    log('  - macOS: https://docs.docker.com/desktop/install/mac-install/');
    log('  - Windows: https://docs.docker.com/desktop/install/windows-install/');
    log('  - Linux: https://docs.docker.com/engine/install/\n');
    process.exit(1);
  }
  success('Docker is installed');

  // Check 2: Docker daemon running
  if (!isDockerRunning()) {
    error('Docker daemon is not running');
    log('\nPlease start Docker Desktop and try again.\n', 'yellow');
    log('You can start Docker Desktop from your applications menu.\n');
    process.exit(1);
  }
  success('Docker daemon is running');

  // Check 3: Docker Compose available
  const composeCmd = getDockerComposeCommand();
  if (!composeCmd) {
    error('Docker Compose is not available');
    log('\nDocker Compose should be included with Docker Desktop.', 'yellow');
    log('Please reinstall Docker Desktop or install Docker Compose separately.\n');
    process.exit(1);
  }
  success(`Docker Compose is available (${composeCmd})`);

  log('\n✅ Docker is ready!\n', 'green');

  // Export the compose command for other scripts to use
  return composeCmd;
}

// Run the check
if (require.main === module) {
  checkDocker();
  process.exit(0);
}

module.exports = { checkDocker, getDockerComposeCommand };
