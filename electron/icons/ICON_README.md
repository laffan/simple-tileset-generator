# Application Icons

This directory should contain the application icons for each platform.

## Required Files

- `icon.png` - Main icon (512x512 pixels recommended, used as source for other formats)
- `icon.icns` - macOS icon (can be generated from icon.png)
- `icon.ico` - Windows icon (can be generated from icon.png)

## Generating Icons

You can generate platform-specific icons from a single PNG file using one of these methods:

### Using electron-icon-maker (recommended)

```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon.png --output=./
```

### Using online tools

- [CloudConvert](https://cloudconvert.com/png-to-icns)
- [ICO Converter](https://www.icoconverter.com/)

### Manual creation

**For macOS (.icns):**
1. Create icon set with sizes: 16, 32, 64, 128, 256, 512, 1024 pixels
2. Use `iconutil` on macOS to convert to .icns

**For Windows (.ico):**
1. Create icon with sizes: 16, 24, 32, 48, 64, 128, 256 pixels
2. Use an ICO converter tool

## Icon Design Guidelines

For best results, the icon should:
- Be square (1:1 aspect ratio)
- Look good at small sizes (16x16)
- Have clear, simple shapes
- Use the app's color scheme
- Work on both light and dark backgrounds

## Default Icon

If no icons are provided, Electron will use a default icon. For releases, custom icons are recommended.
