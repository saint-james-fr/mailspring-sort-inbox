#!/usr/bin/env bash
# Builds the plugin and zips only the files Mailspring needs.
# The zip has one top-level folder, so "Install a Plugin..." can select it directly.
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

name=$(node -p "require('./package.json').name")
version=$(node -p "require('./package.json').version")
zip_path="$PWD/$name-$version.zip"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

mkdir "$stage/$name"
cp -R package.json lib lang styles README.md LICENSE "$stage/$name/"

rm -f "$zip_path"
(cd "$stage" && zip -qr "$zip_path" "$name")

echo "Built $zip_path"
