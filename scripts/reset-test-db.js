#!/usr/bin/env node
/* eslint-env node */
/* global setTimeout */

/**
 * Reset Test Database Script
 *
 * This script resets the test database by:
 * 1. Stopping and removing the test database container
 * 2. Removing the test database volume (clears all data and migration state)
 * 3. Restarting the test database container
 * 4. Waiting for PostgreSQL to initialize
 * 5. Deploying all migrations
 * 6. Optionally seeding test data
 *
 * Usage:
 *   pnpm test:db:reset           # Reset database and deploy migrations
 *   pnpm test:db:reset --seed    # Reset database, deploy migrations, and seed data
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCKER_COMPOSE_FILE = path.join(ROOT_DIR, 'docker/docker-compose.yml');
const DATABASE_PACKAGE = path.join(ROOT_DIR, 'packages/database');
const TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/compilothq_test';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldSeed = args.includes('--seed');

/**
 * Execute a shell command and print output
 */
function exec(command, options = {}) {
  console.log(`\n→ ${command}`);
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: ROOT_DIR,
      ...options,
    });
  } catch (error) {
    console.error(`\n✗ Command failed: ${command}`);
    throw error;
  }
}

/**
 * Main reset workflow
 */
async function resetTestDatabase() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Reset Test Database');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Step 1: Stop and remove test database container
    console.log('Step 1: Stopping test database container...');
    exec(`docker compose -f "${DOCKER_COMPOSE_FILE}" down postgres-test`);

    // Step 2: Remove test database volume
    console.log('\nStep 2: Removing test database volume...');
    exec('docker volume rm compilothq-postgres-test-data');

    // Step 3: Restart test database container
    console.log('\nStep 3: Starting fresh test database container...');
    exec(`docker compose -f "${DOCKER_COMPOSE_FILE}" up -d postgres-test`);

    // Step 4: Wait for PostgreSQL to initialize
    console.log('\nStep 4: Waiting for PostgreSQL to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✓ PostgreSQL should be ready');

    // Step 5: Deploy migrations
    console.log('\nStep 5: Deploying migrations...');
    exec(
      `DATABASE_URL="${TEST_DATABASE_URL}" pnpm prisma migrate deploy`,
      { cwd: DATABASE_PACKAGE }
    );

    // Step 6: Seed data (optional)
    if (shouldSeed) {
      console.log('\nStep 6: Seeding test database...');
      exec(
        `DATABASE_URL="${TEST_DATABASE_URL}" pnpm prisma db seed`,
        { cwd: DATABASE_PACKAGE }
      );
    } else {
      console.log('\nStep 6: Skipping seed (use --seed flag to seed data)');
    }

    // Success
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✓ Test database reset successfully!');
    console.log('═══════════════════════════════════════════════\n');
    console.log(`Database URL: ${TEST_DATABASE_URL}`);
    console.log(`Migrations: Applied`);
    console.log(`Seed data: ${shouldSeed ? 'Loaded' : 'Not loaded (use --seed flag)'}`);
    console.log('\nYou can now run integration tests with:');
    console.log('  pnpm test\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════');
    console.error('  ✗ Test database reset failed!');
    console.error('═══════════════════════════════════════════════\n');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the reset workflow
resetTestDatabase();
