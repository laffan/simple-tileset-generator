const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Save session data to a file path (returns the path saved to, or null if cancelled)
    saveSessionToFile: (jsonString, filePath) => ipcRenderer.invoke('save-session-to-file', jsonString, filePath),

    // Show "Save As" dialog and save session data (returns the chosen path, or null if cancelled)
    saveSessionAs: (jsonString) => ipcRenderer.invoke('save-session-as', jsonString),

    // Show "Open" dialog and load session data (returns { filePath, data } or null if cancelled)
    loadSessionFromDialog: () => ipcRenderer.invoke('load-session-from-dialog'),

    // Listen for menu-triggered save/load
    onMenuSave: (callback) => ipcRenderer.on('menu-save', () => callback()),
    onMenuLoad: (callback) => ipcRenderer.on('menu-load', () => callback()),
});
