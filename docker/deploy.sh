#!/bin/bash
# CompiloHQ Development Database Deployment Script
# Purpose: Deploy Docker containers to dev.franksblog.nl
# Usage: ./deploy.sh [start|stop|restart|status|logs]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
PROJECT_NAME="compilothq-dev"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found!"
        log_info "Please create it from the template:"
        log_info "  cp .env.production.example .env.production"
        log_info "  nano .env.production"
        exit 1
    fi
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed!"
        exit 1
    fi
}

# Start containers
start_containers() {
    log_info "Starting CompiloHQ development database containers..."

    check_env_file

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log_success "Containers started successfully!"
    log_info "Waiting for services to be healthy..."

    sleep 5
    check_health
}

# Stop containers
stop_containers() {
    log_info "Stopping CompiloHQ development database containers..."

    docker compose -f "$COMPOSE_FILE" down

    log_success "Containers stopped successfully!"
}

# Restart containers
restart_containers() {
    log_info "Restarting CompiloHQ development database containers..."

    stop_containers
    sleep 2
    start_containers
}

# Check container status
check_status() {
    log_info "Checking container status..."

    docker compose -f "$COMPOSE_FILE" ps
}

# Check health
check_health() {
    log_info "Checking service health..."

    # Check PostgreSQL
    if docker exec compilothq-dev-postgres pg_isready -U compilothq_dev &> /dev/null; then
        log_success "PostgreSQL is healthy"
    else
        log_error "PostgreSQL is not healthy!"
    fi

    # Check Redis
    if docker exec compilothq-dev-redis redis-cli ping &> /dev/null; then
        log_success "Redis is healthy"
    else
        log_error "Redis is not healthy!"
    fi
}

# View logs
view_logs() {
    log_info "Viewing container logs (Ctrl+C to exit)..."

    docker compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# Show usage
show_usage() {
    echo "CompiloHQ Development Database Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the database containers"
    echo "  stop      - Stop the database containers"
    echo "  restart   - Restart the database containers"
    echo "  status    - Show container status"
    echo "  health    - Check service health"
    echo "  logs      - View container logs"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs"
}

# Main script
main() {
    check_docker

    case "${1:-help}" in
        start)
            start_containers
            ;;
        stop)
            stop_containers
            ;;
        restart)
            restart_containers
            ;;
        status)
            check_status
            ;;
        health)
            check_health
            ;;
        logs)
            view_logs
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
