# Simple Tileset Generator

A browser-based tool for creating pixel art tilesets. Select shapes, patterns, and colors to generate tilesets for use in games or creative projects.

[Try it out!](https://laffan.github.io/simple-tileset-generator/)

## Getting Started

Open `index.html` in a web browser. No installation required.

## Features

### Tile Size

Select from preset sizes (8, 16, 32, 64, 128, 256) or enter a custom size. Preset sizes work best with pattern grids.

### Shapes

The left panel contains available shapes. Each row in the generated tileset represents one selected shape, with columns for each color.

**Shape Controls:**
- Check/uncheck shapes to include them
- Use "all" or "none" links for quick selection
- Hover over a shape to reveal: duplicate (+), edit (pencil), delete (-), reorder (drag handle)

### Patterns

Patterns work like shapes but use pixel-based designs. They appear below shapes in the generated tileset.

### Colors

**Selected Colors:** View current colors as swatches (click to remove) or switch to Hex Input for manual entry.

**Add Colors:**
- **Picker** - HSL color wheel with hue/opacity sliders
- **Palettes** - Pre-made color palettes from various sources
- **Swatches** - Procedurally generated color grid

### Preview

The preview shows your generated tileset. Enable "Fit" to scale the preview to fit the available space.

### Tile Tester

Click "Test" to open full-screen tile tester. Paint with your tiles to see how they look together.

- Select tiles from the palette, paint on the canvas
- Multiple layers with opacity control
- Zoom controls (1x-4x)
- Hold Space and drag to pan
- Download your composition as PNG

### Shape Editor

Click the pencil icon on any shape to open the vector editor.

- Drag points to move them
- Click path edges to add points
- Hold Cmd/Ctrl for resize/rotate handles
- Toolbar: Add shapes, Reflect, Align, Cut operations

### Pattern Editor

Click the pencil icon on any pattern to open the pixel editor.

- Click/drag to draw or erase
- Select grid size (4, 8, 16, 32, custom)
- Invert, upload images, or download patterns

### Sessions

- **Save Session** - Downloads your configuration as JSON
- **Load Session** - Restores a saved session

### Download

Click "Download Tileset!" to save as PNG.

## Tips

- Use tile sizes divisible by pattern grid sizes for crisp results
- Tileset width = colors × tile size
- Tileset height = (shapes + patterns) × tile size

## Credits

Designed by me, coded by ChatGPT
