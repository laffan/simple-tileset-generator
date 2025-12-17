/* Combination Editor Events - Mouse and keyboard interactions */

var combEditorEventsInitialized = false;

// Setup all event listeners
function setupCombinationEditorEvents() {
  if (combEditorEventsInitialized) return;
  combEditorEventsInitialized = true;

  setupCombShapeEditorEvents();
  setupCombPatternEditorEvents();
  setupCombKeyboardEvents();
}

// Remove all event listeners
function removeCombinationEditorEvents() {
  combEditorEventsInitialized = false;
  // Event listeners are on elements that get removed/recreated
}

// Setup shape editor events (Two.js canvas)
function setupCombShapeEditorEvents() {
  const container = document.getElementById('combinationShapeEditorCanvas');
  if (!container) return;

  // Wait for Two.js to render the SVG
  setTimeout(() => {
    const svg = container.querySelector('svg');
    if (!svg) return;

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    svg.addEventListener('mousedown', function(e) {
      const state = CombinationEditorState;
      if (!state.two) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on an anchor
      let clickedAnchorIndex = -1;
      for (let i = 0; i < state.anchors.length; i++) {
        const anchor = state.anchors[i];
        const dx = x - anchor.translation.x;
        const dy = y - anchor.translation.y;
        if (Math.sqrt(dx * dx + dy * dy) < COMB_ANCHOR_RADIUS + 4) {
          clickedAnchorIndex = i;
          break;
        }
      }

      if (clickedAnchorIndex >= 0) {
        // Select anchor
        selectCombAnchor(clickedAnchorIndex, e.shiftKey);
        isDragging = true;
        dragStartX = x;
        dragStartY = y;
        state.isDragging = true;
      } else {
        // Check if clicking on path to add point
        const currentPath = state.paths[state.currentPathIndex];
        if (currentPath && isPointNearPathEdge(x, y, currentPath)) {
          addPointToPathAtPosition(x, y);
        } else {
          // Deselect all
          deselectAllCombAnchors();
        }
      }
    });

    svg.addEventListener('mousemove', function(e) {
      const state = CombinationEditorState;
      if (!state.isDragging || !isDragging) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - dragStartX;
      const dy = y - dragStartY;

      moveCombSelectedAnchors(dx, dy);

      dragStartX = x;
      dragStartY = y;
    });

    svg.addEventListener('mouseup', function() {
      const state = CombinationEditorState;
      isDragging = false;
      state.isDragging = false;
    });

    svg.addEventListener('mouseleave', function() {
      const state = CombinationEditorState;
      isDragging = false;
      state.isDragging = false;
    });
  }, 100);
}

// Check if a point is near a path edge
function isPointNearPathEdge(x, y, path) {
  const vertices = path.vertices;
  const threshold = 10;

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];

    // Distance from point to line segment
    const dist = pointToSegmentDistance(x, y, v1.x, v1.y, v2.x, v2.y);
    if (dist < threshold) {
      return true;
    }
  }
  return false;
}

// Calculate distance from point to line segment
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  return Math.sqrt((px - nearestX) * (px - nearestX) + (py - nearestY) * (py - nearestY));
}

// Add a point to path at the nearest edge position
function addPointToPathAtPosition(x, y) {
  const state = CombinationEditorState;
  const currentPath = state.paths[state.currentPathIndex];
  if (!currentPath) return;

  const vertices = currentPath.vertices;
  let nearestEdge = -1;
  let nearestDist = Infinity;

  // Find nearest edge
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const dist = pointToSegmentDistance(x, y, v1.x, v1.y, v2.x, v2.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEdge = i;
    }
  }

  if (nearestEdge >= 0 && nearestDist < 15) {
    // Insert new vertex after nearestEdge
    const newAnchor = new Two.Anchor(x, y, 0, 0, 0, 0, Two.Commands.line);
    vertices.splice(nearestEdge + 1, 0, newAnchor);

    // Recreate anchor visuals
    createCombAnchorVisuals();

    // Select the new anchor
    selectCombAnchor(nearestEdge + 1);

    updateCombinationPreview();
  }
}

// Setup pattern editor events
function setupCombPatternEditorEvents() {
  const canvas = document.getElementById('combinationPatternEditorCanvas');
  if (!canvas) return;

  canvas.addEventListener('mousedown', function(e) {
    const state = CombinationEditorState;
    if (state.activeTab !== 'pattern') return;

    // Check for spacebar panning
    if (state.isPatternSpacebarHeld) {
      state.isPatternPanning = true;
      state.patternPanStartX = e.clientX;
      state.patternPanStartY = e.clientY;
      return;
    }

    const pixel = getCombPatternPixelFromMouse(e);
    if (!pixel) return;

    state.isPatternDrawing = true;
    state.patternStartPixel = pixel;
    state.patternCurrentPixel = pixel;

    // Determine draw color (toggle based on current pixel)
    const currentValue = state.patternPixelData[pixel.row] && state.patternPixelData[pixel.row][pixel.col];
    state.patternDrawColor = currentValue ? 0 : 1;

    // Check for line mode (shift key)
    state.isPatternLineMode = e.shiftKey;

    if (!state.isPatternLineMode) {
      setCombPatternPixel(pixel.row, pixel.col, state.patternDrawColor);
      drawCombPatternEditorCanvas();
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    const state = CombinationEditorState;

    // Handle panning
    if (state.isPatternPanning) {
      const dx = e.clientX - state.patternPanStartX;
      const dy = e.clientY - state.patternPanStartY;
      state.patternOffsetX += dx;
      state.patternOffsetY += dy;
      state.patternPanStartX = e.clientX;
      state.patternPanStartY = e.clientY;
      state.patternHasPanned = true;
      drawCombPatternEditorCanvas();
      return;
    }

    if (!state.isPatternDrawing) return;

    const pixel = getCombPatternPixelFromMouse(e);
    if (!pixel) return;

    state.patternCurrentPixel = pixel;

    if (state.isPatternLineMode) {
      // Preview line (don't draw yet)
      drawCombPatternEditorCanvas();
      // Draw preview line
      drawCombPatternLinePreview();
    } else {
      // Free draw
      setCombPatternPixel(pixel.row, pixel.col, state.patternDrawColor);
      drawCombPatternEditorCanvas();
    }
  });

  canvas.addEventListener('mouseup', function(e) {
    const state = CombinationEditorState;

    if (state.isPatternPanning) {
      state.isPatternPanning = false;
      return;
    }

    if (!state.isPatternDrawing) return;

    if (state.isPatternLineMode && state.patternStartPixel && state.patternCurrentPixel) {
      // Draw the line
      drawCombPatternLine(
        state.patternStartPixel.row,
        state.patternStartPixel.col,
        state.patternCurrentPixel.row,
        state.patternCurrentPixel.col,
        state.patternDrawColor
      );
    }

    state.isPatternDrawing = false;
    state.patternStartPixel = null;
    state.patternCurrentPixel = null;
    state.isPatternLineMode = false;

    drawCombPatternEditorCanvas();
  });

  canvas.addEventListener('mouseleave', function() {
    const state = CombinationEditorState;
    state.isPatternDrawing = false;
    state.isPatternPanning = false;
    state.patternStartPixel = null;
    state.patternCurrentPixel = null;
  });
}

// Draw line preview on pattern canvas
function drawCombPatternLinePreview() {
  const state = CombinationEditorState;
  if (!state.patternCtx || !state.patternStartPixel || !state.patternCurrentPixel) return;

  const ctx = state.patternCtx;
  const pixelSize = state.patternPixelSize;
  const offsetX = state.patternBoundaryOffsetX + state.patternOffsetX;
  const offsetY = state.patternBoundaryOffsetY + state.patternOffsetY;

  // Calculate line pixels
  const r1 = state.patternStartPixel.row;
  const c1 = state.patternStartPixel.col;
  const r2 = state.patternCurrentPixel.row;
  const c2 = state.patternCurrentPixel.col;

  const dr = Math.abs(r2 - r1);
  const dc = Math.abs(c2 - c1);
  const sr = r1 < r2 ? 1 : -1;
  const sc = c1 < c2 ? 1 : -1;
  let err = dr - dc;

  let r = r1;
  let c = c1;

  ctx.fillStyle = state.patternDrawColor ? 'rgba(51, 51, 51, 0.5)' : 'rgba(255, 255, 255, 0.5)';

  while (true) {
    const x = offsetX + c * pixelSize;
    const y = offsetY + r * pixelSize;
    ctx.fillRect(x, y, pixelSize, pixelSize);

    if (r === r2 && c === c2) break;

    const e2 = 2 * err;
    if (e2 > -dc) {
      err -= dc;
      r += sr;
    }
    if (e2 < dr) {
      err += dr;
      c += sc;
    }
  }
}

// Setup keyboard events
function setupCombKeyboardEvents() {
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('combinationEditorModal');
    if (!modal || !modal.classList.contains('active')) return;

    const state = CombinationEditorState;

    // Spacebar for panning (pattern editor)
    if (e.code === 'Space' && state.activeTab === 'pattern') {
      e.preventDefault();
      state.isPatternSpacebarHeld = true;
      return;
    }

    // Delete selected anchors (shape editor)
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.activeTab === 'shape') {
      if (state.selectedAnchors.length > 0) {
        e.preventDefault();
        deleteCombSelectedAnchors();
      }
    }

    // Arrow keys to nudge selected anchors
    if (state.activeTab === 'shape' && state.selectedAnchors.length > 0) {
      let dx = 0, dy = 0;
      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        moveCombSelectedAnchors(dx, dy);
      }
    }
  });

  document.addEventListener('keyup', function(e) {
    const modal = document.getElementById('combinationEditorModal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.code === 'Space') {
      CombinationEditorState.isPatternSpacebarHeld = false;
      CombinationEditorState.isPatternPanning = false;
    }
  });
}
