# Simple Tileset Generator - Desktop App

This directory contains the Electron wrapper for Simple Tileset Generator, enabling it to run as a standalone desktop application on Windows, macOS, and Linux.

## Features

- **Offline Support**: Works without an internet connection
- **Native Menus**: File, Edit, View, and Help menus with keyboard shortcuts
- **Cross-Platform**: Builds for Windows, macOS (Intel & Apple Silicon), and Linux

## Development

### Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- npm

### Setup

```bash
cd electron
npm install
```

This will:
1. Install Electron and electron-builder
2. Install Two.js locally
3. Copy Two.js to the `lib/` directory for offline use

### Running in Development

```bash
npm start
```

### Building

Build for your current platform:
```bash
npm run dist
```

Build for specific platforms:
```bash
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

Build output will be in `electron/dist/`.

## Automated Builds

GitHub Actions automatically builds the desktop app when:

1. **Version tags**: Push a tag like `v1.0.0` to trigger a release build
2. **Manual dispatch**: Run the workflow manually from the Actions tab

### Creating a Release

1. Update the version in `electron/package.json`
2. Commit and push your changes
3. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will build for all platforms and create a release

### Manual Build

You can also trigger a build manually from the GitHub Actions tab without creating a tag.

## Icons

Place your app icons in the `icons/` directory:

- `icon.png` - General icon (512x512 recommended)
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon

You can generate these from a single PNG using tools like:
- [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker)
- [png2icons](https://www.npmjs.com/package/png2icons)
- Online converters

## File Structure

```
electron/
├── main.js           # Electron main process
├── package.json      # Electron app configuration
├── README.md         # This file
├── icons/            # Application icons
│   ├── icon.png
│   ├── icon.icns
│   └── icon.ico
└── scripts/
    └── copy-two.js   # Post-install script to copy Two.js
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save Session | Cmd/Ctrl + S |
| Load Session | Cmd/Ctrl + O |
| Download PNG | Cmd/Ctrl + Shift + P |
| Download SVG | Cmd/Ctrl + Shift + S |
| Reload | Cmd/Ctrl + R |
| Toggle Full Screen | F11 / Cmd + Ctrl + F |
| Toggle DevTools | Cmd + Opt + I / Ctrl + Shift + I |
| Quit | Cmd + Q / Alt + F4 |

## Notes

- The web version (GitHub Pages) remains unchanged and continues to work independently
- The Electron app loads the same `index.html` but uses a local copy of Two.js
- Session files (`.json`) are compatible between web and desktop versions
