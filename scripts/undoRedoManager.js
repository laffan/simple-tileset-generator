/* Undo/Redo Manager
 *
 * Provides undo/redo functionality for shape, pattern, and combination editors.
 * Uses a snapshot-based approach - capturing full editor state before each operation.
 */

const UndoRedoManager = {
  // Separate history stacks for each editor type
  shapeHistory: [],
  shapeRedoStack: [],

  patternHistory: [],
  patternRedoStack: [],

  combinationHistory: [],
  combinationRedoStack: [],

  // Maximum history size (last N operations)
  maxHistory: 10,

  // Flag to prevent capturing during restore operations
  isRestoring: false,

  // ========== SHAPE EDITOR ==========

  /**
   * Capture current shape editor state
   * Call this BEFORE making changes
   */
  captureShapeState: function() {
    if (this.isRestoring) return;
    if (!EditorState.two || EditorState.paths.length === 0) return;

    const snapshot = this.serializeShapeState();
    if (!snapshot) return;

    this.shapeHistory.push(snapshot);
    if (this.shapeHistory.length > this.maxHistory) {
      this.shapeHistory.shift();
    }
    // Clear redo stack on new action
    this.shapeRedoStack = [];
  },

  /**
   * Serialize shape editor state to JSON-compatible format
   */
  serializeShapeState: function() {
    if (!EditorState.paths || EditorState.paths.length === 0) return null;

    const paths = EditorState.paths.map(path => pathToNormalizedData(path));

    return {
      paths: paths,
      currentPathIndex: EditorState.currentPathIndex,
      fillRule: EditorState.fillRule,
      holePathIndices: [...EditorState.holePathIndices],
      // For combination mode, also capture tile size
      combinationTileRows: EditorState.combinationTileRows,
      combinationTileCols: EditorState.combinationTileCols
    };
  },

  /**
   * Restore shape editor from snapshot
   */
  restoreShapeState: function(snapshot) {
    if (!snapshot || !EditorState.two) return;

    this.isRestoring = true;

    try {
      // Clear existing paths from Two.js scene
      EditorState.paths.forEach(path => {
        EditorState.two.remove(path);
      });

      // Clear anchors
      EditorState.anchors.forEach(anchor => {
        if (anchor.circle) EditorState.two.remove(anchor.circle);
        if (anchor.ctrlLeftLine) EditorState.two.remove(anchor.ctrlLeftLine);
        if (anchor.ctrlRightLine) EditorState.two.remove(anchor.ctrlRightLine);
        if (anchor.ctrlLeftCircle) EditorState.two.remove(anchor.ctrlLeftCircle);
        if (anchor.ctrlRightCircle) EditorState.two.remove(anchor.ctrlRightCircle);
      });

      // Clear bounding box
      if (typeof clearBoundingBox === 'function') {
        clearBoundingBox();
      }

      // Reset state
      EditorState.paths = [];
      EditorState.anchors = [];
      EditorState.selectedAnchors = [];
      EditorState.selectedPathIndices = [];
      EditorState.fillRule = snapshot.fillRule;
      EditorState.holePathIndices = [...(snapshot.holePathIndices || [])];
      EditorState.currentPathIndex = snapshot.currentPathIndex || 0;

      // Restore combination tile size if applicable
      if (EditorState.editorMode === 'combination') {
        if (snapshot.combinationTileRows !== undefined) {
          EditorState.combinationTileRows = snapshot.combinationTileRows;
        }
        if (snapshot.combinationTileCols !== undefined) {
          EditorState.combinationTileCols = snapshot.combinationTileCols;
        }
      }

      // Recreate paths from snapshot
      snapshot.paths.forEach((pathData, index) => {
        const isSelected = index === EditorState.currentPathIndex;
        const isHole = EditorState.holePathIndices.includes(index);
        const path = createPathFromData(pathData, isSelected, isHole);
        EditorState.paths.push(path);
        EditorState.two.add(path);
      });

      // Recreate anchor visuals for current path
      if (typeof createAnchorVisuals === 'function') {
        createAnchorVisuals();
      }

      EditorState.two.update();

      // Update combination-specific UI if needed
      if (EditorState.editorMode === 'combination') {
        if (typeof drawCombinationTileGridOverlay === 'function') {
          drawCombinationTileGridOverlay();
        }
        if (typeof updateCombinationPreview === 'function') {
          updateCombinationPreview();
        }
      }
    } finally {
      this.isRestoring = false;
    }
  },

  /**
   * Undo last shape editor action
   */
  undoShape: function() {
    if (this.shapeHistory.length === 0) return false;

    // Save current state to redo stack
    const current = this.serializeShapeState();
    if (current) {
      this.shapeRedoStack.push(current);
    }

    // Restore previous state
    const previous = this.shapeHistory.pop();
    this.restoreShapeState(previous);

    return true;
  },

  /**
   * Redo last undone shape editor action
   */
  redoShape: function() {
    if (this.shapeRedoStack.length === 0) return false;

    // Save current state to history
    const current = this.serializeShapeState();
    if (current) {
      this.shapeHistory.push(current);
    }

    // Restore next state
    const next = this.shapeRedoStack.pop();
    this.restoreShapeState(next);

    return true;
  },

  /**
   * Clear shape editor history (call when closing editor)
   */
  clearShapeHistory: function() {
    this.shapeHistory = [];
    this.shapeRedoStack = [];
  },

  // ========== PATTERN EDITOR ==========

  /**
   * Capture current pattern editor state
   * Call this BEFORE making changes
   */
  capturePatternState: function() {
    if (this.isRestoring) return;
    if (!PatternEditorState.pixelData || PatternEditorState.pixelData.length === 0) return;

    const snapshot = this.serializePatternState();
    if (!snapshot) return;

    this.patternHistory.push(snapshot);
    if (this.patternHistory.length > this.maxHistory) {
      this.patternHistory.shift();
    }
    // Clear redo stack on new action
    this.patternRedoStack = [];
  },

  /**
   * Serialize pattern editor state
   */
  serializePatternState: function() {
    if (!PatternEditorState.pixelData || PatternEditorState.pixelData.length === 0) return null;

    return {
      pixelData: PatternEditorState.pixelData.map(row => [...row]),
      patternSize: PatternEditorState.patternSize
    };
  },

  /**
   * Restore pattern editor from snapshot
   */
  restorePatternState: function(snapshot) {
    if (!snapshot) return;

    this.isRestoring = true;

    try {
      // Restore pixel data
      PatternEditorState.pixelData = snapshot.pixelData.map(row => [...row]);
      PatternEditorState.patternSize = snapshot.patternSize;

      // Redraw the editor
      if (typeof drawPatternEditor === 'function') {
        drawPatternEditor();
      }
      if (typeof drawPatternPreview === 'function') {
        drawPatternPreview();
      }
    } finally {
      this.isRestoring = false;
    }
  },

  /**
   * Undo last pattern editor action
   */
  undoPattern: function() {
    if (this.patternHistory.length === 0) return false;

    // Save current state to redo stack
    const current = this.serializePatternState();
    if (current) {
      this.patternRedoStack.push(current);
    }

    // Restore previous state
    const previous = this.patternHistory.pop();
    this.restorePatternState(previous);

    return true;
  },

  /**
   * Redo last undone pattern editor action
   */
  redoPattern: function() {
    if (this.patternRedoStack.length === 0) return false;

    // Save current state to history
    const current = this.serializePatternState();
    if (current) {
      this.patternHistory.push(current);
    }

    // Restore next state
    const next = this.patternRedoStack.pop();
    this.restorePatternState(next);

    return true;
  },

  /**
   * Clear pattern editor history
   */
  clearPatternHistory: function() {
    this.patternHistory = [];
    this.patternRedoStack = [];
  },

  // ========== COMBINATION EDITOR ==========

  /**
   * Capture current combination editor state
   * Call this BEFORE making changes
   */
  captureCombinationState: function() {
    if (this.isRestoring) return;
    if (!EditorState.two || EditorState.paths.length === 0) return;

    const snapshot = this.serializeCombinationState();
    if (!snapshot) return;

    this.combinationHistory.push(snapshot);
    if (this.combinationHistory.length > this.maxHistory) {
      this.combinationHistory.shift();
    }
    // Clear redo stack on new action
    this.combinationRedoStack = [];
  },

  /**
   * Serialize combination editor state
   */
  serializeCombinationState: function() {
    if (!EditorState.paths || EditorState.paths.length === 0) return null;

    const paths = EditorState.paths.map(path => pathToNormalizedData(path));

    // Deep copy pathPatterns
    const pathPatterns = {};
    if (CombinationEditorState.pathPatterns) {
      Object.keys(CombinationEditorState.pathPatterns).forEach(key => {
        pathPatterns[key] = { ...CombinationEditorState.pathPatterns[key] };
      });
    }

    return {
      paths: paths,
      currentPathIndex: EditorState.currentPathIndex,
      fillRule: EditorState.fillRule,
      holePathIndices: [...EditorState.holePathIndices],
      tileRows: EditorState.combinationTileRows,
      tileCols: EditorState.combinationTileCols,
      pathPatterns: pathPatterns
    };
  },

  /**
   * Restore combination editor from snapshot
   */
  restoreCombinationState: function(snapshot) {
    if (!snapshot || !EditorState.two) return;

    this.isRestoring = true;

    try {
      // Clear existing paths from Two.js scene
      EditorState.paths.forEach(path => {
        EditorState.two.remove(path);
      });

      // Clear anchors
      EditorState.anchors.forEach(anchor => {
        if (anchor.circle) EditorState.two.remove(anchor.circle);
        if (anchor.ctrlLeftLine) EditorState.two.remove(anchor.ctrlLeftLine);
        if (anchor.ctrlRightLine) EditorState.two.remove(anchor.ctrlRightLine);
        if (anchor.ctrlLeftCircle) EditorState.two.remove(anchor.ctrlLeftCircle);
        if (anchor.ctrlRightCircle) EditorState.two.remove(anchor.ctrlRightCircle);
      });

      // Clear bounding box
      if (typeof clearBoundingBox === 'function') {
        clearBoundingBox();
      }

      // Reset state
      EditorState.paths = [];
      EditorState.anchors = [];
      EditorState.selectedAnchors = [];
      EditorState.selectedPathIndices = [];
      EditorState.fillRule = snapshot.fillRule;
      EditorState.holePathIndices = [...(snapshot.holePathIndices || [])];
      EditorState.currentPathIndex = snapshot.currentPathIndex || 0;
      EditorState.combinationTileRows = snapshot.tileRows || 2;
      EditorState.combinationTileCols = snapshot.tileCols || 2;

      // Restore path patterns
      CombinationEditorState.pathPatterns = {};
      if (snapshot.pathPatterns) {
        Object.keys(snapshot.pathPatterns).forEach(key => {
          CombinationEditorState.pathPatterns[key] = { ...snapshot.pathPatterns[key] };
        });
      }

      // Recreate paths from snapshot
      snapshot.paths.forEach((pathData, index) => {
        const isSelected = index === EditorState.currentPathIndex;
        const isHole = EditorState.holePathIndices.includes(index);
        const path = createPathFromData(pathData, isSelected, isHole);
        EditorState.paths.push(path);
        EditorState.two.add(path);
      });

      // Recreate anchor visuals for current path
      if (typeof createAnchorVisuals === 'function') {
        createAnchorVisuals();
      }

      EditorState.two.update();

      // Update combination UI
      if (typeof drawCombinationTileGridOverlay === 'function') {
        drawCombinationTileGridOverlay();
      }
      if (typeof updateCombinationPreview === 'function') {
        updateCombinationPreview();
      }
      if (typeof loadPathPatternInfo === 'function') {
        loadPathPatternInfo();
      }

      // Update tile size display
      const rowsDisplay = document.getElementById('combTileRowsValue');
      const colsDisplay = document.getElementById('combTileColsValue');
      if (rowsDisplay) rowsDisplay.textContent = EditorState.combinationTileRows;
      if (colsDisplay) colsDisplay.textContent = EditorState.combinationTileCols;
    } finally {
      this.isRestoring = false;
    }
  },

  /**
   * Undo last combination editor action
   */
  undoCombination: function() {
    if (this.combinationHistory.length === 0) return false;

    // Save current state to redo stack
    const current = this.serializeCombinationState();
    if (current) {
      this.combinationRedoStack.push(current);
    }

    // Restore previous state
    const previous = this.combinationHistory.pop();
    this.restoreCombinationState(previous);

    return true;
  },

  /**
   * Redo last undone combination editor action
   */
  redoCombination: function() {
    if (this.combinationRedoStack.length === 0) return false;

    // Save current state to history
    const current = this.serializeCombinationState();
    if (current) {
      this.combinationHistory.push(current);
    }

    // Restore next state
    const next = this.combinationRedoStack.pop();
    this.restoreCombinationState(next);

    return true;
  },

  /**
   * Clear combination editor history
   */
  clearCombinationHistory: function() {
    this.combinationHistory = [];
    this.combinationRedoStack = [];
  },

  // ========== UTILITY ==========

  /**
   * Check if undo is available for the active editor
   */
  canUndo: function(editorType) {
    switch (editorType) {
      case 'shape': return this.shapeHistory.length > 0;
      case 'pattern': return this.patternHistory.length > 0;
      case 'combination': return this.combinationHistory.length > 0;
      default: return false;
    }
  },

  /**
   * Check if redo is available for the active editor
   */
  canRedo: function(editorType) {
    switch (editorType) {
      case 'shape': return this.shapeRedoStack.length > 0;
      case 'pattern': return this.patternRedoStack.length > 0;
      case 'combination': return this.combinationRedoStack.length > 0;
      default: return false;
    }
  }
};

// Global keyboard handler for undo/redo
function setupUndoRedoKeyboardHandler() {
  document.addEventListener('keydown', function(e) {
    // Check for Cmd/Ctrl + Z (undo) or Cmd/Ctrl + Shift + Z (redo)
    const isUndo = (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey;
    const isRedo = (e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey;

    if (!isUndo && !isRedo) return;

    // Determine which editor is active
    const shapeEditorModal = document.getElementById('shapeEditorModal');
    const patternEditorModal = document.getElementById('patternEditorModal');
    const combinationEditorModal = document.getElementById('combinationEditorModal');

    let handled = false;

    // Shape editor (standalone)
    if (shapeEditorModal && shapeEditorModal.classList.contains('active')) {
      e.preventDefault();
      if (isUndo) {
        handled = UndoRedoManager.undoShape();
      } else if (isRedo) {
        handled = UndoRedoManager.redoShape();
      }
    }
    // Pattern editor (standalone)
    else if (patternEditorModal && patternEditorModal.classList.contains('active')) {
      e.preventDefault();
      if (isUndo) {
        handled = UndoRedoManager.undoPattern();
      } else if (isRedo) {
        handled = UndoRedoManager.redoPattern();
      }
    }
    // Combination editor
    else if (combinationEditorModal && combinationEditorModal.classList.contains('active')) {
      e.preventDefault();
      if (isUndo) {
        handled = UndoRedoManager.undoCombination();
      } else if (isRedo) {
        handled = UndoRedoManager.redoCombination();
      }
    }
  });
}

// Initialize keyboard handler when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupUndoRedoKeyboardHandler);
} else {
  setupUndoRedoKeyboardHandler();
}
