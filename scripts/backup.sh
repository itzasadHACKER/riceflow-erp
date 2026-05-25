#!/bin/bash
# Grainix ERP - PostgreSQL Automated Backup Script
# Usage: ./scripts/backup.sh [daily|weekly|monthly]
# Set up as cron job: 0 2 * * * /path/to/scripts/backup.sh daily

set -euo pipefail

BACKUP_TYPE="${1:-daily}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/grainix-erp}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-grainix_erp}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAILY=7
RETENTION_WEEKLY=4
RETENTION_MONTHLY=12

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_TYPE}/grainix_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}/${BACKUP_TYPE}"

echo "[$(date)] Starting ${BACKUP_TYPE} backup..."

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges --format=custom \
  | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: ${BACKUP_FILE} (${FILE_SIZE})"

case "$BACKUP_TYPE" in
  daily)
    find "${BACKUP_DIR}/daily" -name "*.sql.gz" -mtime +${RETENTION_DAILY} -delete 2>/dev/null || true
    echo "[$(date)] Cleaned up daily backups older than ${RETENTION_DAILY} days"
    ;;
  weekly)
    find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -mtime +$((RETENTION_WEEKLY * 7)) -delete 2>/dev/null || true
    echo "[$(date)] Cleaned up weekly backups older than ${RETENTION_WEEKLY} weeks"
    ;;
  monthly)
    find "${BACKUP_DIR}/monthly" -name "*.sql.gz" -mtime +$((RETENTION_MONTHLY * 30)) -delete 2>/dev/null || true
    echo "[$(date)] Cleaned up monthly backups older than ${RETENTION_MONTHLY} months"
    ;;
esac

echo "[$(date)] Backup process complete."
echo ""
echo "To restore: gunzip -c ${BACKUP_FILE} | pg_restore -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME"
echo ""
echo "Recommended cron setup:"
echo "  0 2 * * * ${PWD}/scripts/backup.sh daily      # Daily at 2 AM"
echo "  0 3 * * 0 ${PWD}/scripts/backup.sh weekly     # Weekly on Sunday at 3 AM"
echo "  0 4 1 * * ${PWD}/scripts/backup.sh monthly    # Monthly on 1st at 4 AM"
