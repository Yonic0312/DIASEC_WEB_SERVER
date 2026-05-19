#!/usr/bin/env bash
# Pipeline: full MariaDB dump -> user DBs only -> MySQL 5.7-friendly syntax.
#
# Usage:
#   ./scripts/prepare-mariadb-dump-for-mysql57.sh /root/diasec_legacy_....sql /root/diasec_for_mysql57.sql
# Then: ./scripts/import-dump-into-mysql57.sh /root/diasec_for_mysql57.sql

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "${1:-}" && -n "${2:-}" ]] || {
  echo "Usage: $0 input_mariadb_full_dump.sql output_mysql57.sql" >&2
  exit 1
}

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
"$DIR/filter-mysqldump-user-databases.sh" "$1" >"$TMP"
"$DIR/sanitize-mariadb-dump-for-mysql57.sh" "$TMP" >"$2"
in_bytes="$(wc -c <"$1" | tr -d " ")"
out_bytes="$(wc -c <"$2" | tr -d " ")"
echo "Wrote $2 ($out_bytes bytes)"
# Large full dump but tiny user-DB-only output usually means only mysql.* had tables (MariaDB system), not your app schema.
if [[ "$in_bytes" -gt 100000 && "$out_bytes" -lt 5000 ]]; then
  echo "WARNING: input was ${in_bytes} bytes but user-database output is only ${out_bytes} bytes." >&2
  echo "  Often mysqldump --all-databases is huge because of the mysql system schema; your app DB (e.g. diasecDB) may still be empty." >&2
  echo "  This volume may never have held application tables — look for another backup or host." >&2
fi
