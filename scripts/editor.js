/* Shape Editor using Two.js
 *
 * This file serves as the entry point for the shape editor.
 * The editor functionality has been modularized into separate files
 * located in the editorFunctions/ folder:
 *
 * - state.js: Shared state (EditorState) and constants
 * - coordinates.js: Coordinate conversion functions
 * - grid.js: Grid drawing functions
 * - pathManagement.js: Path creation, loading, and conversion
 * - anchorManagement.js: Anchor point visual management
 * - pointOperations.js: Add, delete, and toggle point operations
 * - pathNavigation.js: Multi-path navigation functions
 * - eventHandlers.js: Mouse and interaction event handlers
 * - modalManager.js: Modal open, close, and save operations
 *
 * All functions are globally accessible and use the shared EditorState object.
 */
