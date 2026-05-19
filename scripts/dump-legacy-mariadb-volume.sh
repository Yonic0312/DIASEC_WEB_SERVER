#!/usr/bin/env bash
# Dump logical backup from the OLD Docker volume (MariaDB-era datadir).
# Does NOT mount this volume on MySQL 5.7 (unsafe). Uses a temporary MariaDB container on host port 3307.
#
# Usage (from repo root):
#   ./scripts/dump-legacy-mariadb-volume.sh
#   LEGACY_VOLUME=diasecweb_diasec_mysql_data ./scripts/dump-legacy-mariadb-volume.sh
#   DUMP_ALL=1 ./scripts/dump-legacy-mariadb-volume.sh   # mysqldump --all-databases
#
# If mariadb:10.6 fails to start, try: MARIADB_IMAGE=mariadb:10.3-focal

set -euo pipefail

ROOT_PASSWORD="${ROOT_PASSWORD:-diasec0504}"
DB_NAME="${DB_NAME:-diasecDB}"
HOST_PORT="${HOST_PORT:-3307}"
CONTAINER_NAME="${CONTAINER_NAME:-diasec_legacy_mariadb_dump}"
MARIADB_IMAGE="${MARIADB_IMAGE:-mariadb:10.6-focal}"
OUT_FILE="${OUT_FILE:-$HOME/diasec_legacy_$(date +%Y%m%d_%H%M%S).sql}"

resolve_volume() {
  if [[ -n "${LEGACY_VOLUME:-}" ]]; then
    echo "$LEGACY_VOLUME"
    return
  fi
  local v
  v="$(docker volume ls -q | grep -E '_diasec_mysql_data$' | grep -v mysql57 | head -n1 || true)"
  if [[ -z "$v" ]]; then
    echo "Could not find legacy volume. Set LEGACY_VOLUME explicitly (docker volume ls)." >&2
    exit 1
  fi
  echo "$v"
}

LEGACY_VOLUME="$(resolve_volume)"
echo "Using volume: $LEGACY_VOLUME"
echo "Output file:  $OUT_FILE"

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Removing existing container: $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

echo "Starting temporary MariaDB (image: $MARIADB_IMAGE, host port $HOST_PORT)..."
# Note: InnoDB recovery usually needs write access to the datadir (not :ro).
# For a byte-for-byte safety copy first: docker volume create diasec_mysql_legacy_clone
#   && docker run --rm -v "$LEGACY_VOLUME:/from" -v diasec_mysql_legacy_clone:/to alpine cp -a /from/. /to/.
# Then set LEGACY_VOLUME=diasec_mysql_legacy_clone for this script.
docker run -d \
  --name "$CONTAINER_NAME" \
  -v "$LEGACY_VOLUME:/var/lib/mysql" \
  -p "${HOST_PORT}:3306" \
  "$MARIADB_IMAGE" >/dev/null

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Waiting for MariaDB to accept connections..."
ok=0
for _ in $(seq 1 90); do
  if docker exec "$CONTAINER_NAME" mysqladmin ping -uroot -p"$ROOT_PASSWORD" --silent 2>/dev/null; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "$ok" -ne 1 ]]; then
  echo "MariaDB did not become ready. Logs:" >&2
  docker logs "$CONTAINER_NAME" 2>&1 | tail -n 80 >&2
  echo >&2
  echo "Try another image, e.g. MARIADB_IMAGE=mariadb:10.3-focal or check root password (ROOT_PASSWORD)." >&2
  exit 1
fi

if [[ "${DUMP_ALL:-0}" == "1" ]]; then
  echo "Running mysqldump --all-databases ..."
  docker exec "$CONTAINER_NAME" mysqldump -uroot -p"$ROOT_PASSWORD" \
    --all-databases --single-transaction --routines --events --triggers \
    >"$OUT_FILE"
else
  echo "Running mysqldump --databases $DB_NAME ..."
  docker exec "$CONTAINER_NAME" mysqldump -uroot -p"$ROOT_PASSWORD" \
    --databases "$DB_NAME" --single-transaction --routines --events --triggers \
    >"$OUT_FILE"
fi

ls -lh "$OUT_FILE"
echo "Done. Next: ./scripts/import-dump-into-mysql57.sh \"$OUT_FILE\""
