#!/bin/bash
# CompiloHQ Development Database Backup Script
# Purpose: Create backups of PostgreSQL database
# Usage: ./backup.sh [daily|manual]
# Can be run via cron for automated backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
POSTGRES_CONTAINER="compilothq-dev-postgres"
POSTGRES_USER="compilothq_dev"
POSTGRES_DB="compilothq_development"
BACKUP_DIR="/home/supergoose/compilothq/backups"
RETENTION_DAYS=7  # Keep backups for 7 days

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

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Create PostgreSQL backup
backup_postgres() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/compilothq_dev_${timestamp}.sql"
    local backup_file_gz="${backup_file}.gz"

    log_info "Creating PostgreSQL backup..."

    # Create SQL dump
    if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file"; then
        # Compress the backup
        gzip "$backup_file"

        local file_size=$(du -h "$backup_file_gz" | cut -f1)
        log_success "Backup created successfully: $backup_file_gz ($file_size)"

        return 0
    else
        log_error "Backup failed!"
        return 1
    fi
}

# Backup Redis (if needed)
backup_redis() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local redis_backup_dir="${BACKUP_DIR}/redis"

    log_info "Triggering Redis save..."

    # Create Redis backup directory
    if [ ! -d "$redis_backup_dir" ]; then
        mkdir -p "$redis_backup_dir"
    fi

    # Trigger Redis BGSAVE
    if docker exec compilothq-dev-redis redis-cli BGSAVE &> /dev/null; then
        log_success "Redis backup triggered (saved to volume)"

        # Optionally copy RDB file from volume
        # This requires accessing the Docker volume
        # Uncomment if you need a copy outside the volume:
        # docker cp compilothq-dev-redis:/data/dump.rdb "${redis_backup_dir}/dump_${timestamp}.rdb"

        return 0
    else
        log_error "Redis backup failed!"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    local deleted=0

    # Find and delete old SQL backups
    while IFS= read -r file; do
        rm -f "$file"
        ((deleted++))
    done < <(find "$BACKUP_DIR" -name "compilothq_dev_*.sql.gz" -type f -mtime +$RETENTION_DAYS)

    if [ $deleted -gt 0 ]; then
        log_info "Deleted $deleted old backup(s)"
    else
        log_info "No old backups to delete"
    fi
}

# List existing backups
list_backups() {
    log_info "Existing backups in $BACKUP_DIR:"
    echo ""

    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR/*.sql.gz 2>/dev/null)" ]; then
        ls -lh "$BACKUP_DIR"/*.sql.gz | awk '{print "  " $9 " (" $5 ")"}'
        echo ""

        local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
        log_info "Total backup size: $total_size"
    else
        echo "  No backups found"
    fi
}

# Restore from backup
restore_backup() {
    local backup_file=$1

    if [ -z "$backup_file" ]; then
        log_error "Please specify a backup file to restore"
        log_info "Usage: $0 restore <backup_file>"
        list_backups
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_warning "This will restore the database from: $backup_file"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    log_info "Restoring database..."

    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" "$POSTGRES_DB"
    else
        docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" "$POSTGRES_DB" < "$backup_file"
    fi

    log_success "Database restored successfully!"
}

# Show usage
show_usage() {
    echo "CompiloHQ Development Database Backup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  daily      - Create daily backup (with cleanup)"
    echo "  manual     - Create manual backup (no cleanup)"
    echo "  list       - List existing backups"
    echo "  restore    - Restore from backup"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 daily"
    echo "  $0 list"
    echo "  $0 restore /path/to/backup.sql.gz"
}

# Main script
main() {
    case "${1:-help}" in
        daily)
            create_backup_dir
            backup_postgres
            backup_redis
            cleanup_old_backups
            ;;
        manual)
            create_backup_dir
            backup_postgres
            backup_redis
            ;;
        list)
            list_backups
            ;;
        restore)
            restore_backup "$2"
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
