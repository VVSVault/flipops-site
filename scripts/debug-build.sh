#!/bin/bash
set -e

echo "========================================"
echo "=== RAILWAY BUILD ENVIRONMENT DEBUG ==="
echo "========================================"

echo ""
echo "=== ENVIRONMENT ==="
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PWD: $(pwd)"
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

echo ""
echo "=== FOLDER STRUCTURE ==="
ls -la | head -20

echo ""
echo "=== CONFIG FILES IN ROOT ==="
ls -la *.config.* 2>/dev/null || echo "No config files found in root"

echo ""
echo "=== TAILWIND CONFIG ==="
if [ -f tailwind.config.js ]; then
  cat tailwind.config.js
elif [ -f tailwind.config.ts ]; then
  cat tailwind.config.ts
else
  echo "ERROR: No tailwind config found"
  exit 1
fi

echo ""
echo "=== POSTCSS CONFIG ==="
if [ -f postcss.config.js ]; then
  cat postcss.config.js
elif [ -f postcss.config.mjs ]; then
  cat postcss.config.mjs
else
  echo "ERROR: No postcss config found"
  exit 1
fi

echo ""
echo "=== GLOBALS.CSS HEAD (first 40 lines) ==="
head -40 app/globals.css

echo ""
echo "=== PACKAGE.JSON TAILWIND VERSION ==="
grep -A 1 '"tailwindcss"' package.json

echo ""
echo "=== TESTING TAILWIND CLI DIRECTLY ==="
npx tailwindcss -i ./app/globals.css -o ./test-output.css --minify

echo ""
echo "=== TAILWIND CLI OUTPUT SIZE ==="
if [ -f test-output.css ]; then
  wc -c test-output.css
  echo ""
  echo "First 200 lines of test-output.css:"
  head -200 test-output.css
else
  echo "ERROR: test-output.css not generated"
  exit 1
fi

echo ""
echo ""
echo "=== GENERATING PRISMA CLIENT ==="
prisma generate

echo ""
echo "=== BUILDING STANDALONE CSS FILE ==="
npx tailwindcss -i ./app/globals.css -o ./public/styles.css --minify
echo "CSS file generated:"
ls -lah public/styles.css
wc -c public/styles.css

echo ""
echo "=== RUNNING NEXT.JS BUILD ==="
next build

echo ""
echo "=== POST-BUILD: CSS FILES GENERATED ==="
find .next/static -name "*.css" -type f -exec ls -lah {} \; || echo "No CSS files found in .next/static"

echo ""
echo "=== POST-BUILD: CSS FILE SIZES ==="
find .next/static -name "*.css" -type f -exec wc -c {} \; || echo "No CSS files found"

echo ""
echo "=== POST-BUILD: CSS CONTENT SAMPLES (first 200 lines each) ==="
for file in $(find .next/static -name "*.css" -type f); do
  echo "--- File: $file ---"
  head -200 "$file"
  echo ""
done

echo ""
echo "=== POST-BUILD: STATIC FOLDER STRUCTURE ==="
find .next/static -type f | head -50

echo ""
echo "========================================"
echo "=== BUILD COMPLETE - CHECK ABOVE FOR ISSUES ==="
echo "========================================"
