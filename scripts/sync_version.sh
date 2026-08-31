#!/usr/bin/env bash
set -euo pipefail

version="${1:?usage: sync_version.sh <version>}"

sed -i "s/\"version\": \"[0-9][0-9.]*\"/\"version\": \"$version\"/" package.json