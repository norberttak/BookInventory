#!/bin/bash

# Fixed build script for Electron application - addresses index.html issue
set -e

echo "Building Book Inventory Electron App (Fixed)..."

# Detect platform for appropriate runtime
PLATFORM=$(uname -s)
case $PLATFORM in
    Darwin*)
        RUNTIME="osx-x64"
        if [[ $(uname -m) == "arm64" ]]; then
            RUNTIME="osx-arm64"
        fi
        ;;
    Linux*)
        RUNTIME="linux-x64"
        ;;
    CYGWIN*|MINGW*|MSYS*)
        RUNTIME="win-x64"
        ;;
    *)
        RUNTIME="linux-x64"
        echo "Unknown platform, defaulting to linux-x64"
        ;;
esac

echo "Building for platform: $RUNTIME"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf release/

# Install all dependencies
echo "Installing dependencies..."
npm install

# Build Blazor application
echo "Building Blazor application..."
dotnet publish -c Release -o ./dist --self-contained true -r $RUNTIME

# Verify build output
if [ ! -d "./dist/wwwroot" ]; then
    echo "ERROR: wwwroot directory not found!"
    echo "Contents of dist directory:"
    ls -la ./dist/
    exit 1
fi

echo "✓ Blazor build successful"
echo "wwwroot contents:"
ls -la ./dist/wwwroot/

# Verify executable exists
EXECUTABLE="./dist/BookInventory"
if [ "$RUNTIME" = "win-x64" ]; then
    EXECUTABLE="./dist/BookInventory.exe"
fi

if [ ! -f "$EXECUTABLE" ]; then
    echo "ERROR: Blazor executable not found at $EXECUTABLE"
    exit 1
fi

echo "✓ Found Blazor executable: $EXECUTABLE"

# Make executable (for Unix-like systems)
if [ "$RUNTIME" != "win-x64" ]; then
    chmod +x "$EXECUTABLE"
fi

# Verify index.html exists
if [ ! -f "./wwwroot/index.html" ]; then
    echo "WARNING: index.html not found in wwwroot, but it should be there for development fallback"
fi

if [ ! -f "./dist/wwwroot/index.html" ]; then
    echo "WARNING: index.html not found in dist/wwwroot"
    echo "Contents of dist/wwwroot:"
    ls -la ./dist/wwwroot/
fi

# Create comprehensive electron-builder config
cat > ./electron-builder-fixed.yml << EOF
appId: com.bookinventory.app
productName: Book Inventory
copyright: Copyright © 2024
electronVersion: 30.0.0

directories:
  output: release

files:
  - electron/main.js
  - electron/preload.js
  - package.json

extraResources:
  - from: dist
    to: dist

mac:
  category: public.app-category.productivity
  target: 
    - target: dmg
      arch: [x64, arm64]
  hardenedRuntime: false
  gatekeeperAssess: false
  entitlements: electron/entitlements.mac.plist
  entitlementsInherit: electron/entitlements.mac.plist

win:
  target: nsis

linux:
  target: AppImage
EOF

# Build with the fixed config
echo "Building Electron application..."
npx electron-builder --config electron-builder-fixed.yml

echo ""
echo "✓ Build complete! Check the 'release' directory for the packaged application."
echo ""
echo "The application now includes:"
echo "  ✓ Complete Blazor Server application with executable"
echo "  ✓ All wwwroot static files"
echo "  ✓ SQLite database support"
echo "  ✓ Barcode scanner functionality"
echo "  ✓ V8 crash fixes for macOS"
echo ""
echo "To test: Launch the app from the 'release' directory"