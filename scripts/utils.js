/* Utility functions */

function sanitizeColorInput() {
  // Get the color input textarea element
  const colorInput = document.getElementById('colorInput');

  // Add event listener for the "paste" event
  colorInput.addEventListener('paste', function (event) {
    event.preventDefault(); // Prevent the default paste behavior
    console.log("pasted")
    // Get the pasted content from the clipboard
    const pastedContent = event.clipboardData.getData('text/plain');

    // Remove quotes, brackets, and hashtags from the pasted content
    const cleanedContent = pastedContent.replace(/['"\[\]#]/g, '');

    // Update the textarea value with the cleaned content
    colorInput.value = cleanedContent;

    // Trigger the "input" event to update the colors preview and generate the tileset
    colorInput.dispatchEvent(new Event('input'));
  });

}
