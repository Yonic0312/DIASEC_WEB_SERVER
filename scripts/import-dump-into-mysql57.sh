#!/usr/bin/env bash
# Import a logical dump (from dump-legacy-mariadb-volume.sh or mysqldump) into the compose MySQL 5.7 service.
#
# Usage (from repo root, db service running):
#   docker compose up -d db
#   ./scripts/import-dump-into-mysql57.sh ~/diasec_legacy_YYYYMMDD_HHMMSS.sql
#
# If you need a completely empty MySQL 5.7 data dir first:
#   docker compose stop db
#   docker volume rm diasecweb_diasec_mysql57_data   # WARNING: deletes current MySQL 5.7 data
#   docker compose up -d db
#   ./scripts/import-dump-into-mysql57.sh your.sql

set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
DUMP_FILE="${1:-}"

if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "Usage: $0 /path/to/dump.sql" >&2
  exit 1
fi

cd "$COMPOSE_DIR"

if ! docker compose ps db --status running --quiet 2>/dev/null | grep -q .; then
  echo "Compose service 'db' is not running. Start with: docker compose up -d db" >&2
  exit 1
fi

echo "Importing $DUMP_FILE into service 'db' (MySQL 5.7)..."
docker compose exec -T db mysql -uroot -pdiasec0504 <"$DUMP_FILE"
echo "Import finished. Verify: docker compose exec db mysql -uroot -pdiasec0504 -e 'SHOW TABLES IN diasecDB;'"
