#!/usr/bin/env node

/**
 * Docker Health Check
 *
 * This script checks the health status of all CompiloHQ Docker services
 * and displays a formatted status table.
 *
 * Exit codes:
 * - 0: All services healthy
 * - 1: Docker not available or services not running
 * - 2: Services running but not healthy
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { resolve, join } = require('path');
const { getDockerComposeCommand } = require('./check-docker');

// Color codes
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

// Project paths
const PROJECT_ROOT = resolve(__dirname, '..');
const DOCKER_DIR = join(PROJECT_ROOT, 'docker');
const COMPOSE_FILE = join(DOCKER_DIR, 'docker-compose.yml');

/**
 * Get container details
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

    const lines = output.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (err) {
    return [];
  }
}

/**
 * Get container health from docker inspect
 */
function getContainerHealth(containerName) {
  try {
    const output = execSync(
      `docker inspect --format='{{.State.Health.Status}}' ${containerName}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    return output || 'none';
  } catch (err) {
    return 'unknown';
  }
}

/**
 * Format uptime
 */
function formatUptime(status) {
  // Status contains uptime info like "Up 5 minutes"
  const match = status.match(/Up (.+)/);
  return match ? match[1] : 'N/A';
}

/**
 * Get status icon and color
 */
function getStatusDisplay(state, health) {
  if (state !== 'running') {
    return { icon: '●', color: 'red', text: 'stopped' };
  }

  if (health === 'healthy') {
    return { icon: '●', color: 'green', text: 'healthy' };
  }

  if (health === 'starting') {
    return { icon: '◐', color: 'yellow', text: 'starting' };
  }

  if (health === 'unhealthy') {
    return { icon: '●', color: 'red', text: 'unhealthy' };
  }

  // No health check defined or none
  return { icon: '●', color: 'green', text: 'running' };
}

/**
 * Print status table
 */
function printStatusTable(services) {
  log('\n📊 CompiloHQ Docker Services Status\n', 'blue');

  // Table header
  log('┌─────────────────────────────────────────────────────────────────┐');
  log('│ Service    │ Status      │ Health     │ Uptime              │');
  log('├─────────────────────────────────────────────────────────────────┤');

  services.forEach(service => {
    const name = service.Service.padEnd(10);
    const health = getContainerHealth(service.Name);
    const display = getStatusDisplay(service.State, health);
    const uptime = formatUptime(service.Status).padEnd(18);

    const statusText = display.text.padEnd(11);
    const healthText = (health === 'none' ? 'N/A' : health).padEnd(10);

    const iconColored = `${colors[display.color]}${display.icon}${colors.reset}`;

    log(`│ ${name} │ ${iconColored} ${statusText} │ ${healthText} │ ${uptime} │`);
  });

  log('└─────────────────────────────────────────────────────────────────┘\n');
}

/**
 * Check network status
 */
function checkNetwork(composeCmd) {
  try {
    const output = execSync(
      'docker network ls --format json',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    const lines = output.trim().split('\n');
    const networks = lines.map(line => JSON.parse(line));
    const compilothqNetwork = networks.find(n => n.Name === 'compilothq-network');

    if (compilothqNetwork) {
      log('✓ Network: compilothq-network (active)', 'green');
    } else {
      log('⚠ Network: compilothq-network (not found)', 'yellow');
    }
  } catch (err) {
    log('⚠ Unable to check network status', 'yellow');
  }
}

/**
 * Check volumes
 */
function checkVolumes() {
  try {
    const output = execSync(
      'docker volume ls --format json',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    const lines = output.trim().split('\n');
    const volumes = lines.map(line => JSON.parse(line));

    const postgresVol = volumes.find(v => v.Name === 'compilothq-postgres-data');
    const redisVol = volumes.find(v => v.Name === 'compilothq-redis-data');

    if (postgresVol) {
      log('✓ Volume: compilothq-postgres-data', 'green');
    } else {
      log('⚠ Volume: compilothq-postgres-data (not found)', 'yellow');
    }

    if (redisVol) {
      log('✓ Volume: compilothq-redis-data', 'green');
    } else {
      log('⚠ Volume: compilothq-redis-data (not found)', 'yellow');
    }
  } catch (err) {
    log('⚠ Unable to check volume status', 'yellow');
  }
}

/**
 * Main health check
 */
function checkHealth() {
  // Check Docker availability
  const composeCmd = getDockerComposeCommand();
  if (!composeCmd) {
    log('\n❌ Docker Compose is not available\n', 'red');
    process.exit(1);
  }

  // Check if compose file exists
  if (!existsSync(COMPOSE_FILE)) {
    log('\n❌ docker-compose.yml not found\n', 'red');
    process.exit(1);
  }

  // Get service status
  const services = getServiceStatus(composeCmd);

  if (services.length === 0) {
    log('\n⚠ No Docker services are running', 'yellow');
    log('\nStart services with: pnpm docker:up\n');
    process.exit(1);
  }

  // Print status table
  printStatusTable(services);

  // Check network and volumes
  log('📡 Infrastructure Status\n', 'blue');
  checkNetwork(composeCmd);
  checkVolumes();
  log('');

  // Determine exit code
  let allHealthy = true;
  services.forEach(service => {
    if (service.State !== 'running') {
      allHealthy = false;
    } else {
      const health = getContainerHealth(service.Name);
      if (health === 'unhealthy') {
        allHealthy = false;
      }
    }
  });

  if (!allHealthy) {
    log('⚠ Some services are not healthy\n', 'yellow');
    log('Run `pnpm docker:logs` to see detailed logs\n');
    process.exit(2);
  }

  log('✅ All services are healthy\n', 'green');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  checkHealth();
}

module.exports = { checkHealth };
