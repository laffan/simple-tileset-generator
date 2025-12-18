/* Tile Tester Layers Panel - Layer management UI */

// Thumbnail dimensions
var LAYER_THUMB_WIDTH = 100;
var LAYER_THUMB_HEIGHT = 50;

// Setup the layers panel
function setupLayersPanel() {
  renderLayersList();
  setupLayersPanelEvents();
}

// Render the layers list
function renderLayersList() {
  const container = document.getElementById('tileTesterLayersList');
  if (!container) return;

  container.innerHTML = '';

  // Render layers in reverse order (top layer first in UI)
  const layers = [...TileTesterState.layers].reverse();

  layers.forEach((layer, displayIndex) => {
    const actualIndex = TileTesterState.layers.length - 1 - displayIndex;
    const layerEl = createLayerElement(layer, actualIndex);
    container.appendChild(layerEl);
  });

  // Generate initial thumbnails
  setTimeout(() => {
    TileTesterState.layers.forEach(layer => {
      updateLayerThumbnail(layer.id);
    });
  }, 100);
}

// Create a layer list item element
function createLayerElement(layer, index) {
  const div = document.createElement('div');
  div.className = 'tester-layer-item' + (layer.id === TileTesterState.activeLayerId ? ' active' : '');
  div.dataset.layerId = layer.id;
  div.dataset.index = index;

  div.innerHTML = `
    <div class="tester-layer-drag-handle" draggable="true" title="Drag to reorder">&#x2630;</div>
    <div class="tester-layer-thumbnail">
      <canvas id="layerThumb${layer.id}" width="${LAYER_THUMB_WIDTH}" height="${LAYER_THUMB_HEIGHT}"></canvas>
    </div>
    <div class="tester-layer-opacity-wrapper">
      <input type="range" class="tester-layer-opacity-slider"
             min="0" max="100" value="${Math.round(layer.opacity * 100)}"
             title="Opacity: ${Math.round(layer.opacity * 100)}%">
    </div>
    <button class="tester-layer-delete" title="Delete layer">&times;</button>
  `;

  // Click to select layer
  div.addEventListener('click', function(e) {
    if (e.target.closest('.tester-layer-opacity-wrapper')) return;
    if (e.target.closest('.tester-layer-delete')) return;
    if (e.target.closest('.tester-layer-drag-handle')) return;
    TileTesterState.activeLayerId = layer.id;
    renderLayersList();
  });

  // Opacity slider - prevent drag conflicts
  const opacitySlider = div.querySelector('.tester-layer-opacity-slider');
  opacitySlider.addEventListener('input', function(e) {
    e.stopPropagation();
    setLayerOpacity(layer.id, this.value / 100);
    this.title = 'Opacity: ' + this.value + '%';
  });
  opacitySlider.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  opacitySlider.addEventListener('pointerdown', function(e) {
    e.stopPropagation();
  });

  // Delete button
  const deleteBtn = div.querySelector('.tester-layer-delete');
  deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (TileTesterState.layers.length > 1) {
      deleteTileTesterLayer(layer.id);
    }
  });

  return div;
}

// Update a specific layer's thumbnail
function updateLayerThumbnail(layerId) {
  const layer = TileTesterState.layers.find(l => l.id === layerId);
  if (!layer) return;

  const thumbCanvas = document.getElementById('layerThumb' + layerId);
  if (!thumbCanvas) return;

  const ctx = thumbCanvas.getContext('2d');
  const sourceCanvas = document.getElementById('canvas');
  const tileSize = TileTesterState.tileSize;

  // Clear thumbnail
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, LAYER_THUMB_WIDTH, LAYER_THUMB_HEIGHT);

  if (!sourceCanvas) return;

  // Calculate scale to fit layer content in thumbnail
  const layerPixelWidth = TileTesterState.gridWidth * tileSize;
  const layerPixelHeight = TileTesterState.gridHeight * tileSize;
  const scale = Math.min(
    LAYER_THUMB_WIDTH / layerPixelWidth,
    LAYER_THUMB_HEIGHT / layerPixelHeight
  );

  const thumbTileSize = tileSize * scale;
  const offsetX = (LAYER_THUMB_WIDTH - TileTesterState.gridWidth * thumbTileSize) / 2;
  const offsetY = (LAYER_THUMB_HEIGHT - TileTesterState.gridHeight * thumbTileSize) / 2;

  // Draw tiles for this layer only
  for (let y = 0; y < TileTesterState.gridHeight; y++) {
    for (let x = 0; x < TileTesterState.gridWidth; x++) {
      const tile = layer.tiles[y] && layer.tiles[y][x];

      if (tile) {
        // Get canvas coordinates - handles both semantic refs and old-style {row, col}
        const coords = getTileCanvasCoords(tile);
        if (!coords) continue;

        const srcX = coords.col * tileSize;
        const srcY = coords.row * tileSize;
        const destX = offsetX + x * thumbTileSize;
        const destY = offsetY + y * thumbTileSize;

        ctx.drawImage(
          sourceCanvas,
          srcX, srcY, tileSize, tileSize,
          destX, destY, thumbTileSize, thumbTileSize
        );
      }
    }
  }
}

// Setup drag and drop for layer reordering
function setupLayersPanelEvents() {
  const container = document.getElementById('tileTesterLayersList');
  const addBtn = document.getElementById('tileTesterAddLayerBtn');

  if (!container) return;

  // Add layer button
  if (addBtn) {
    addBtn.addEventListener('click', addTileTesterLayer);
  }

  // Drag and drop
  let draggedItem = null;
  let draggedIndex = null;
  let dropTargetIndex = null;
  let dropBefore = false;

  container.addEventListener('dragstart', function(e) {
    // Only allow drag from the drag handle
    if (!e.target.classList || !e.target.classList.contains('tester-layer-drag-handle')) {
      e.preventDefault();
      return;
    }

    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem) return;

    draggedItem = layerItem;
    draggedIndex = parseInt(layerItem.dataset.index);

    // Use the whole layer item as the drag image
    const rect = layerItem.getBoundingClientRect();
    e.dataTransfer.setDragImage(layerItem, rect.width / 2, rect.height / 2);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerItem.dataset.layerId);

    // Add dragging class after a short delay (so drag image captures original state)
    setTimeout(() => {
      layerItem.classList.add('dragging');
    }, 0);
  });

  container.addEventListener('dragend', function(e) {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');
      draggedItem = null;
      draggedIndex = null;
    }

    // Reset drop tracking
    dropTargetIndex = null;
    dropBefore = false;

    // Remove all drop indicators
    container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  });

  container.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedItem) return;

    // Find the layer item we're hovering over (skip indicators and dragged item)
    let layerItem = e.target.closest('.tester-layer-item');
    if (layerItem === draggedItem) layerItem = null;

    // If hovering over indicator, find adjacent layer item
    if (!layerItem && e.target.classList.contains('tester-layer-drop-indicator')) {
      const items = Array.from(container.querySelectorAll('.tester-layer-item'));
      const indicator = e.target;
      const indicatorRect = indicator.getBoundingClientRect();

      // Find closest layer item
      for (const item of items) {
        if (item === draggedItem) continue;
        const itemRect = item.getBoundingClientRect();
        if (Math.abs(itemRect.bottom - indicatorRect.top) < 10 ||
            Math.abs(itemRect.top - indicatorRect.bottom) < 10) {
          layerItem = item;
          break;
        }
      }
    }

    if (!layerItem) return;

    // Remove existing indicators
    container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over');
    });

    // Determine if dragging above or below
    const rect = layerItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    // Store drop position
    dropTargetIndex = parseInt(layerItem.dataset.index);
    dropBefore = e.clientY < midY;

    // Create drop indicator line
    const indicator = document.createElement('div');
    indicator.className = 'tester-layer-drop-indicator';

    if (dropBefore) {
      // Insert before this item
      layerItem.parentNode.insertBefore(indicator, layerItem);
    } else {
      // Insert after this item
      layerItem.parentNode.insertBefore(indicator, layerItem.nextSibling);
    }

    layerItem.classList.add('drag-over');
  });

  container.addEventListener('dragleave', function(e) {
    // Only remove if leaving the container entirely
    if (!container.contains(e.relatedTarget)) {
      container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
      container.querySelectorAll('.tester-layer-item').forEach(item => {
        item.classList.remove('drag-over');
      });
    }
  });

  container.addEventListener('drop', function(e) {
    e.preventDefault();

    // Remove indicators
    container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over');
    });

    if (!draggedItem || dropTargetIndex === null) return;
    if (dropTargetIndex === draggedIndex) return;

    // Calculate new index based on stored drop position
    let newIndex;
    if (dropBefore) {
      newIndex = dropTargetIndex + 1;
    } else {
      newIndex = dropTargetIndex;
    }

    if (draggedIndex < newIndex) {
      newIndex--;
    }

    reorderLayers(draggedIndex, newIndex);

    // Reset drop tracking
    dropTargetIndex = null;
    dropBefore = false;
  });
}
