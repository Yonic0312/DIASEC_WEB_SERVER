#!/usr/bin/env bash
# Drop mysql / information_schema / performance_schema / sys sections from mysqldump --all-databases
# (MariaDB system tables must not be loaded into MySQL 5.7.)
#
# Usage: ./scripts/filter-mysqldump-user-databases.sh full_dump.sql > user_only.sql

set -euo pipefail
[[ -f "${1:-}" ]] || { echo "Usage: $0 full_dump.sql > user_only.sql" >&2; exit 1; }

perl -0777 -e '
my $path = $ARGV[0];
open my $fh, "<", $path or die "$path: $!";
my $s = do { local $/; <$fh> };
close $fh;

my %skip = map { $_ => 1 } qw(mysql information_schema performance_schema sys);
my @parts = split /(?=^--\R-- Current Database: `[^`]+`\R--\R)/m, $s;
print shift @parts;
for my $p (@parts) {
  if ($p =~ /^--\R-- Current Database: `([^`]+)`\R--\R/) {
    print $p unless $skip{$1};
  } else {
    print $p;
  }
}
' "$1"
