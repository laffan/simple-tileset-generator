/* Tile Tester Layers Panel - Layer management UI */

// Thumbnail dimensions
var LAYER_THUMB_WIDTH = 100;
var LAYER_THUMB_HEIGHT = 50;

// Track if layers panel events are initialized
var layersPanelEventsInitialized = false;

// Store event handler references for removal
var layersPanelEventHandlers = {
  dragstart: null,
  dragend: null,
  dragover: null,
  dragleave: null,
  drop: null,
  addLayerBtn: null
};

// Drag state - stored globally to avoid closure issues with multiple listeners
var layerDragState = {
  draggedItem: null,
  draggedIndex: null,
  dropTargetIndex: null,
  dropBefore: false
};

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

  const visibilityIcon = layer.visible ? '&#128065;' : '&#128064;'; // Open eye vs closed eye
  const visibilityClass = layer.visible ? '' : ' hidden';
  const visibilityTitle = layer.visible ? 'Hide layer' : 'Show layer';

  div.innerHTML = `
    <div class="tester-layer-drag-handle" draggable="true" title="Drag to reorder">&#x2630;</div>
    <button class="tester-layer-visibility${visibilityClass}" title="${visibilityTitle}">${visibilityIcon}</button>
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
    if (e.target.closest('.tester-layer-visibility')) return;
    TileTesterState.activeLayerId = layer.id;
    renderLayersList();
  });

  // Visibility toggle button
  const visibilityBtn = div.querySelector('.tester-layer-visibility');
  visibilityBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleLayerVisibility(layer.id);
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

// Update a specific layer's thumbnail (sparse format)
function updateLayerThumbnail(layerId) {
  const layer = TileTesterState.layers.find(l => l.id === layerId);
  if (!layer) return;

  const thumbCanvas = document.getElementById('layerThumb' + layerId);
  if (!thumbCanvas) return;

  const ctx = thumbCanvas.getContext('2d');
  const sourceCanvas = document.getElementById('canvas');
  const tileSize = TileTesterState.tileSize;
  const origin = TileTesterState.gridOrigin;

  // Clear thumbnail
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, LAYER_THUMB_WIDTH, LAYER_THUMB_HEIGHT);

  if (!sourceCanvas) return;
  if (!layer.tiles || !Array.isArray(layer.tiles) || layer.tiles.length === 0) return;

  // Calculate bounds of tiles in this layer
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const entry of layer.tiles) {
    minX = Math.min(minX, entry.x);
    minY = Math.min(minY, entry.y);
    maxX = Math.max(maxX, entry.x);
    maxY = Math.max(maxY, entry.y);
  }

  // Calculate scale to fit layer content in thumbnail
  const tileWidth = maxX - minX + 1;
  const tileHeight = maxY - minY + 1;
  const layerPixelWidth = Math.max(tileWidth, 1) * tileSize;
  const layerPixelHeight = Math.max(tileHeight, 1) * tileSize;
  const scale = Math.min(
    LAYER_THUMB_WIDTH / layerPixelWidth,
    LAYER_THUMB_HEIGHT / layerPixelHeight,
    1  // Don't scale up, only down
  );

  const thumbTileSize = tileSize * scale;
  const offsetX = (LAYER_THUMB_WIDTH - tileWidth * thumbTileSize) / 2;
  const offsetY = (LAYER_THUMB_HEIGHT - tileHeight * thumbTileSize) / 2;

  // Draw tiles for this layer only (sparse format)
  for (const entry of layer.tiles) {
    const tile = entry.tile;
    const tileX = entry.x;
    const tileY = entry.y;

    // Get canvas coordinates - handles both semantic refs and old-style {row, col}
    const coords = getTileCanvasCoords(tile);
    if (!coords) continue;

    const srcX = coords.col * tileSize;
    const srcY = coords.row * tileSize;
    const destX = offsetX + (tileX - minX) * thumbTileSize;
    const destY = offsetY + (tileY - minY) * thumbTileSize;

    ctx.drawImage(
      sourceCanvas,
      srcX, srcY, tileSize, tileSize,
      destX, destY, thumbTileSize, thumbTileSize
    );
  }
}

// Setup drag and drop for layer reordering
function setupLayersPanelEvents() {
  // Guard against multiple initialization
  if (layersPanelEventsInitialized) return;
  layersPanelEventsInitialized = true;

  const container = document.getElementById('tileTesterLayersList');
  const addBtn = document.getElementById('tileTesterAddLayerBtn');

  if (!container) return;

  // Add layer button
  if (addBtn) {
    layersPanelEventHandlers.addLayerBtn = addTileTesterLayer;
    addBtn.addEventListener('click', layersPanelEventHandlers.addLayerBtn);
  }

  // Drag and drop handlers using global state
  layersPanelEventHandlers.dragstart = function(e) {
    // Only allow drag from the drag handle
    if (!e.target.classList || !e.target.classList.contains('tester-layer-drag-handle')) {
      e.preventDefault();
      return;
    }

    const layerItem = e.target.closest('.tester-layer-item');
    if (!layerItem) return;

    layerDragState.draggedItem = layerItem;
    layerDragState.draggedIndex = parseInt(layerItem.dataset.index);

    // Use the whole layer item as the drag image
    const rect = layerItem.getBoundingClientRect();
    e.dataTransfer.setDragImage(layerItem, rect.width / 2, rect.height / 2);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerItem.dataset.layerId);

    // Add dragging class after a short delay (so drag image captures original state)
    setTimeout(() => {
      layerItem.classList.add('dragging');
    }, 0);
  };

  layersPanelEventHandlers.dragend = function(e) {
    if (layerDragState.draggedItem) {
      layerDragState.draggedItem.classList.remove('dragging');
      layerDragState.draggedItem = null;
      layerDragState.draggedIndex = null;
    }

    // Reset drop tracking
    layerDragState.dropTargetIndex = null;
    layerDragState.dropBefore = false;

    // Remove all drop indicators
    container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  };

  layersPanelEventHandlers.dragover = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!layerDragState.draggedItem) return;

    // Find the layer item we're hovering over (skip indicators and dragged item)
    let layerItem = e.target.closest('.tester-layer-item');
    if (layerItem === layerDragState.draggedItem) layerItem = null;

    // If hovering over indicator, find adjacent layer item
    if (!layerItem && e.target.classList.contains('tester-layer-drop-indicator')) {
      const items = Array.from(container.querySelectorAll('.tester-layer-item'));
      const indicator = e.target;
      const indicatorRect = indicator.getBoundingClientRect();

      // Find closest layer item
      for (const item of items) {
        if (item === layerDragState.draggedItem) continue;
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
    layerDragState.dropTargetIndex = parseInt(layerItem.dataset.index);
    layerDragState.dropBefore = e.clientY < midY;

    // Create drop indicator line
    const indicator = document.createElement('div');
    indicator.className = 'tester-layer-drop-indicator';

    if (layerDragState.dropBefore) {
      // Insert before this item
      layerItem.parentNode.insertBefore(indicator, layerItem);
    } else {
      // Insert after this item
      layerItem.parentNode.insertBefore(indicator, layerItem.nextSibling);
    }

    layerItem.classList.add('drag-over');
  };

  layersPanelEventHandlers.dragleave = function(e) {
    // Only remove if leaving the container entirely
    if (!container.contains(e.relatedTarget)) {
      container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
      container.querySelectorAll('.tester-layer-item').forEach(item => {
        item.classList.remove('drag-over');
      });
    }
  };

  layersPanelEventHandlers.drop = function(e) {
    e.preventDefault();

    // Remove indicators
    container.querySelectorAll('.tester-layer-drop-indicator').forEach(el => el.remove());
    container.querySelectorAll('.tester-layer-item').forEach(item => {
      item.classList.remove('drag-over');
    });

    if (!layerDragState.draggedItem || layerDragState.dropTargetIndex === null) return;
    if (layerDragState.dropTargetIndex === layerDragState.draggedIndex) return;

    // Calculate new index based on stored drop position
    let newIndex;
    if (layerDragState.dropBefore) {
      newIndex = layerDragState.dropTargetIndex + 1;
    } else {
      newIndex = layerDragState.dropTargetIndex;
    }

    if (layerDragState.draggedIndex < newIndex) {
      newIndex--;
    }

    reorderLayers(layerDragState.draggedIndex, newIndex);

    // Reset drop tracking
    layerDragState.dropTargetIndex = null;
    layerDragState.dropBefore = false;
  };

  container.addEventListener('dragstart', layersPanelEventHandlers.dragstart);
  container.addEventListener('dragend', layersPanelEventHandlers.dragend);
  container.addEventListener('dragover', layersPanelEventHandlers.dragover);
  container.addEventListener('dragleave', layersPanelEventHandlers.dragleave);
  container.addEventListener('drop', layersPanelEventHandlers.drop);
}

// Remove layers panel event listeners
function removeLayersPanelEvents() {
  const container = document.getElementById('tileTesterLayersList');
  const addBtn = document.getElementById('tileTesterAddLayerBtn');

  if (container) {
    if (layersPanelEventHandlers.dragstart) {
      container.removeEventListener('dragstart', layersPanelEventHandlers.dragstart);
    }
    if (layersPanelEventHandlers.dragend) {
      container.removeEventListener('dragend', layersPanelEventHandlers.dragend);
    }
    if (layersPanelEventHandlers.dragover) {
      container.removeEventListener('dragover', layersPanelEventHandlers.dragover);
    }
    if (layersPanelEventHandlers.dragleave) {
      container.removeEventListener('dragleave', layersPanelEventHandlers.dragleave);
    }
    if (layersPanelEventHandlers.drop) {
      container.removeEventListener('drop', layersPanelEventHandlers.drop);
    }
  }

  if (addBtn && layersPanelEventHandlers.addLayerBtn) {
    addBtn.removeEventListener('click', layersPanelEventHandlers.addLayerBtn);
  }

  // Reset state
  layerDragState.draggedItem = null;
  layerDragState.draggedIndex = null;
  layerDragState.dropTargetIndex = null;
  layerDragState.dropBefore = false;

  layersPanelEventsInitialized = false;
}
