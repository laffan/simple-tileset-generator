/* Editor Grid - Grid drawing functions */

// Draw a reference grid
function drawEditorGrid() {
  const gridGroup = EditorState.two.makeGroup();
  const gridSize = 40;
  const gridColor = '#e0e0e0';

  for (let i = 0; i <= EDITOR_SIZE; i += gridSize) {
    const vLine = EditorState.two.makeLine(i, 0, i, EDITOR_SIZE);
    vLine.stroke = gridColor;
    vLine.linewidth = 1;
    gridGroup.add(vLine);

    const hLine = EditorState.two.makeLine(0, i, EDITOR_SIZE, i);
    hLine.stroke = gridColor;
    hLine.linewidth = 1;
    gridGroup.add(hLine);
  }

  // Draw center lines
  const centerV = EditorState.two.makeLine(EDITOR_SIZE / 2, 0, EDITOR_SIZE / 2, EDITOR_SIZE);
  centerV.stroke = '#ccc';
  centerV.linewidth = 2;
  gridGroup.add(centerV);

  const centerH = EditorState.two.makeLine(0, EDITOR_SIZE / 2, EDITOR_SIZE, EDITOR_SIZE / 2);
  centerH.stroke = '#ccc';
  centerH.linewidth = 2;
  gridGroup.add(centerH);

  // Draw red boundary showing the save area
  // Skip for combination mode - it uses its own dynamic boundary overlay
  if (EditorState.editorMode !== 'combination') {
    const boundary = EditorState.two.makeRectangle(
      EDITOR_SIZE / 2,  // center x
      EDITOR_SIZE / 2,  // center y
      EDITOR_SHAPE_SIZE,  // width
      EDITOR_SHAPE_SIZE   // height
    );
    boundary.fill = 'transparent';
    boundary.stroke = '#dc3545';
    boundary.linewidth = 2;
    boundary.dashes = [8, 4];
    gridGroup.add(boundary);
  }
}
