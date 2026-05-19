#!/usr/bin/env bash
# Strip MariaDB-only CREATE TABLE / ALTER clauses so mysqldump output can load on MySQL 5.7.
# Usage: ./scripts/sanitize-mariadb-dump-for-mysql57.sh in.sql > out.sql

set -euo pipefail
[[ -f "${1:-}" ]] || { echo "Usage: $0 input.sql > output.sql" >&2; exit 1; }

# perl: remove MariaDB-specific table options; collapse bad commas/spacing.
perl -0777 -pe '
  s/\s*PAGE_CHECKSUM=\d+//g;
  s/\s*TRANSACTIONAL=\d+//g;
  s/\s*ENCRYPTED=(?:YES|NO|DEFAULT)\b//g;
  s/\s*ENCRYPTION_KEY_ID=\d+//g;
  s/\s*IETF_QUOTES=\d+//g;
  # Do NOT replace ENGINE=Aria -> InnoDB: MariaDB mysql.* uses Aria; forcing InnoDB breaks MySQL 5.7 system rules.
  # System DBs should be filtered out (filter-mysqldump-user-databases.sh) before sanitize.
  while (s/,\s*,/, /g) {}
  s/,\s*\)/)/g;
' "$1"
