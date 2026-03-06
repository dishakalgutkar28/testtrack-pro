#!/bin/bash
# Build script for Railway
# This ensures npm install is used instead of npm ci

echo "Installing dependencies with npm install..."
npm install --legacy-peer-deps --no-audit --no-fund --ignore-scripts

echo "Making railway-start.sh executable..."
chmod +x railway-start.sh

echo "Build complete!"
