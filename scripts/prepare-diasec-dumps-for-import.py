#!/usr/bin/env python3
"""
Merge MySQL Workbench / per-table dump files:
  - All files: keep DROP + CREATE (strip INSERT data).
  - member table file only: also keep INSERT statements that contain "d2one" (case-insensitive).

Usage:
  python3 scripts/prepare-diasec-dumps-for-import.py /path/to/Dump20260407 > diasec_import.sql

Or write to file:
  python3 scripts/prepare-diasec-dumps-for-import.py /path/to/Dump20260407 -o db/diasec_schema_plus_d2one.sql

Copy your Windows dumps into the server folder first, e.g.:
  scp Dump20260407/diasecdb_*.sql user@server:~/DiasecWeb/db/dump_incoming/
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

INSERT_RE = re.compile(r"INSERT\s+INTO[^;]+;", re.IGNORECASE | re.DOTALL)
LOCK_RE = re.compile(r"LOCK\s+TABLES[^;]+;", re.IGNORECASE)
UNLOCK_RE = re.compile(r"UNLOCK\s+TABLES\s*;", re.IGNORECASE)


def strip_lock_unlock(sql: str) -> str:
    sql = LOCK_RE.sub("", sql)
    sql = UNLOCK_RE.sub("", sql)
    return sql


def schema_only(sql: str) -> str:
    sql = strip_lock_unlock(sql)
    sql = INSERT_RE.sub("", sql)
    return sql


def member_schema_plus_d2one(sql: str) -> str:
    sql = strip_lock_unlock(sql)
    inserts = INSERT_RE.findall(sql)
    keep = [i for i in inserts if "d2one" in i.lower()]
    base = INSERT_RE.sub("", sql)
    if not keep:
        print(
            "WARNING: no INSERT containing 'd2one' found in member dump; output has member DDL only.",
            file=sys.stderr,
        )
    return base.rstrip() + "\n\n" + "\n".join(keep) + ("\n" if keep else "")


def is_member_table_dump(path: Path) -> bool:
    """True only for `member` table (not order_items, etc.)."""
    stem = path.stem.lower()
    if "_" not in stem:
        return stem == "member"
    return stem.rsplit("_", 1)[-1] == "member"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("dump_dir", type=Path, help="Folder containing diasecdb_*.sql files")
    ap.add_argument("-o", "--output", type=Path, default=None, help="Write file instead of stdout")
    args = ap.parse_args()
    d = args.dump_dir
    if not d.is_dir():
        print(f"Not a directory: {d}", file=sys.stderr)
        sys.exit(1)

    files = sorted(d.glob("diasecdb_*.sql"))
    if not files:
        files = sorted(d.glob("*.sql"))
    if not files:
        print(f"No .sql files in {d}", file=sys.stderr)
        sys.exit(1)

    parts = [
        "/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;",
        "/*!40101 SET NAMES utf8mb4 */;",
        "/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;",
        "CREATE DATABASE IF NOT EXISTS `diasecDB` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
        "USE `diasecDB`;",
        "",
    ]

    for path in files:
        raw = path.read_text(encoding="utf-8", errors="replace")
        if is_member_table_dump(path):
            chunk = member_schema_plus_d2one(raw)
        else:
            chunk = schema_only(raw)
        parts.append(f"-- --- {path.name} ---")
        parts.append(chunk.strip())
        parts.append("")

    parts.append("/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;")

    out = "\n".join(parts) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(out, encoding="utf-8")
        print(f"Wrote {args.output} ({len(out)} bytes)", file=sys.stderr)
    else:
        sys.stdout.write(out)


if __name__ == "__main__":
    main()
