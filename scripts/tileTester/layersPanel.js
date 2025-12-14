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
  div.draggable = true;

  div.innerHTML = `
    <div class="tester-layer-drag-handle">&#x2630;</div>
    <div class="tester-layer-thumbnail">
      <canvas id="layerThumb${layer.id}" width="${LAYER_THUMB_WIDTH}" height="${LAYER_THUMB_HEIGHT}"></canvas>
    </div>
    <div class="tester-layer-controls">
      <input type="number" class="tester-layer-opacity-input"
             min="0" max="100" value="${Math.round(layer.opacity * 100)}"
             title="Opacity %">
      <button class="tester-layer-delete" title="Delete layer">&times;</button>
    </div>
  `;

  // Click to select layer
  div.addEventListener('click', function(e) {
    if (e.target.closest('.tester-layer-controls')) return;
    if (e.target.closest('.tester-layer-drag-handle')) return;
    TileTesterState.activeLayerId = layer.id;
    renderLayersList();
  });

  // Opacity input
  const opacityInput = div.querySelector('.tester-layer-opacity-input');
  opacityInput.addEventListener('input', function(e) {
    e.stopPropagation();
    let val = parseInt(this.value) || 0;
    val = Math.max(0, Math.min(100, val));
    setLayerOpacity(layer.id, val / 100);
  });
  opacityInput.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  opacityInput.addEventListener('mousedown', function(e) {
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
        const srcX = tile.col * tileSize;
        const srcY = tile.row * tileSize;
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

  container.addEventListener('dragstart', function(e) {
    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem) return;

    draggedItem = layerItem;
    draggedIndex = parseInt(layerItem.dataset.index);
    layerItem.classList.add('dragging');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerItem.dataset.layerId);
  });

  container.addEventListener('dragend', function(e) {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');
      draggedItem = null;
      draggedIndex = null;
    }

    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  });

  container.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem || layerItem === draggedItem) return;

    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    const rect = layerItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (e.clientY < midY) {
      layerItem.classList.add('drag-over-top');
    } else {
      layerItem.classList.add('drag-over-bottom');
    }
  });

  container.addEventListener('drop', function(e) {
    e.preventDefault();

    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem || !draggedItem) return;

    const targetIndex = parseInt(layerItem.dataset.index);
    if (targetIndex === draggedIndex) return;

    const rect = layerItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    let newIndex;
    if (e.clientY < midY) {
      newIndex = targetIndex + 1;
    } else {
      newIndex = targetIndex;
    }

    if (draggedIndex < newIndex) {
      newIndex--;
    }

    reorderLayers(draggedIndex, newIndex);
  });
}
