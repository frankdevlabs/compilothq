#!/bin/bash
# CompiloHQ Development Database Health Check Script
# Purpose: Monitor health of database services
# Usage: ./health-check.sh
# Can be run via cron for continuous monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
POSTGRES_CONTAINER="compilothq-dev-postgres"
REDIS_CONTAINER="compilothq-dev-redis"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if container is running
check_container_running() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

# Check PostgreSQL health
check_postgres() {
    log_info "Checking PostgreSQL..."

    if ! check_container_running "$POSTGRES_CONTAINER"; then
        log_error "PostgreSQL container is not running!"
        return 1
    fi

    # Check if PostgreSQL is ready
    if docker exec "$POSTGRES_CONTAINER" pg_isready -U compilothq_dev &> /dev/null; then
        log_success "PostgreSQL is healthy and accepting connections"

        # Get database size
        local db_size=$(docker exec "$POSTGRES_CONTAINER" psql -U compilothq_dev -d compilothq_development -t -c "SELECT pg_size_pretty(pg_database_size('compilothq_development'));" 2>/dev/null | xargs)
        echo "         Database size: $db_size"

        # Get number of active connections
        local connections=$(docker exec "$POSTGRES_CONTAINER" psql -U compilothq_dev -d compilothq_development -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
        echo "         Active connections: $connections"

        return 0
    else
        log_error "PostgreSQL is not healthy!"
        return 1
    fi
}

# Check Redis health
check_redis() {
    log_info "Checking Redis..."

    if ! check_container_running "$REDIS_CONTAINER"; then
        log_error "Redis container is not running!"
        return 1
    fi

    # Check if Redis is responding
    if docker exec "$REDIS_CONTAINER" redis-cli ping &> /dev/null; then
        log_success "Redis is healthy and responding"

        # Get Redis info
        local used_memory=$(docker exec "$REDIS_CONTAINER" redis-cli info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        local connected_clients=$(docker exec "$REDIS_CONTAINER" redis-cli info clients 2>/dev/null | grep "connected_clients" | cut -d: -f2 | tr -d '\r')

        echo "         Memory used: $used_memory"
        echo "         Connected clients: $connected_clients"

        return 0
    else
        log_error "Redis is not healthy!"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log_info "Checking disk space..."

    local available=$(df -h / | awk 'NR==2 {print $4}')
    local usage=$(df -h / | awk 'NR==2 {print $5}')

    echo "         Available: $available (Used: $usage)"

    # Warning if usage > 80%
    local usage_percent=$(echo $usage | sed 's/%//')
    if [ "$usage_percent" -gt 80 ]; then
        log_error "Disk space is running low! ($usage used)"
        return 1
    else
        log_success "Disk space is adequate"
        return 0
    fi
}

# Check container resource usage
check_resources() {
    log_info "Checking resource usage..."

    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $POSTGRES_CONTAINER $REDIS_CONTAINER
}

# Main health check
main() {
    echo "========================================="
    echo "CompiloHQ Dev Database Health Check"
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================="
    echo ""

    local all_healthy=true

    # Check PostgreSQL
    if ! check_postgres; then
        all_healthy=false
    fi
    echo ""

    # Check Redis
    if ! check_redis; then
        all_healthy=false
    fi
    echo ""

    # Check disk space
    if ! check_disk_space; then
        all_healthy=false
    fi
    echo ""

    # Check resources
    check_resources
    echo ""

    # Final summary
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy!"
        echo ""
        exit 0
    else
        log_error "Some services are unhealthy!"
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"
