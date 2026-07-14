const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let hasActiveTrades = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 750,
    minWidth: 40,
    minHeight: 40,
    maxWidth: 1600,
    maxHeight: 1600,
    resizable: true,
    alwaysOnTop: false,
    frame: true, // Use system frame for minimize/maximize/close buttons and title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load URL
  if (process.env.VITE_DEV_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_URL);
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle close preventer if active trades are running
  mainWindow.on('close', (e) => {
    if (hasActiveTrades) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Yes, Close', 'No, Keep Open'],
        title: 'Confirm Exit',
        message: 'You have active open trades! Are you sure you want to exit and close the assistant?',
        defaultId: 1,
        cancelId: 1
      });
      if (choice === 1) {
        e.preventDefault();
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Toggle window collapse
ipcMain.on('set-window-collapsed', (event, collapsed, customDimensions) => {
  if (!mainWindow) return;

  const unfoldedWidth = Math.round((customDimensions && customDimensions.unfoldedWidth) || 400);
  const unfoldedHeight = Math.round((customDimensions && customDimensions.unfoldedHeight) || 750);
  const foldedWidth = Math.round((customDimensions && customDimensions.foldedWidth) || 200);
  const foldedHeight = Math.round((customDimensions && customDimensions.foldedHeight) || 120);

  if (collapsed) {
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(Math.min(40, foldedWidth), Math.min(40, foldedHeight));
    mainWindow.setMaximumSize(Math.max(1600, foldedWidth), Math.max(1600, foldedHeight));
    mainWindow.setSize(foldedWidth, foldedHeight);
    mainWindow.setResizable(false);
  } else {
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(Math.min(40, unfoldedWidth), Math.min(40, unfoldedHeight));
    mainWindow.setMaximumSize(Math.max(1600, unfoldedWidth), Math.max(1600, unfoldedHeight));
    mainWindow.setSize(unfoldedWidth, unfoldedHeight);
  }
});

// IPC Handler: Set always on top
ipcMain.on('set-always-on-top', (event, alwaysOnTop) => {
  if (!mainWindow) return;
  mainWindow.setAlwaysOnTop(alwaysOnTop, 'screen-saver');
});

// IPC Handler: Update active trade state
ipcMain.on('update-active-trade-state', (event, state) => {
  hasActiveTrades = !!state;
});

// IPC Handler: Restore window
ipcMain.on('restore-window', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
});

// IPC Handler: Select directory
ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return { success: false, path: '' };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: '' };
  }

  return { success: true, path: result.filePaths[0] };
});

// IPC Handler: Save Excel / CSV file
ipcMain.handle('save-excel-file', async (event, { folderPath, fileName, csvContent }) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fullPath = path.join(folderPath, fileName);
    // Write using UTF-8 with BOM to support Persian characters in Excel
    const bom = '\uFEFF';
    fs.writeFileSync(fullPath, bom + csvContent, 'utf8');

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error saving Excel file:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Take Screenshot
ipcMain.handle('take-screenshot', async (event, { monitorIndex, folderPath, fileName }) => {
  try {
    const displays = screen.getAllDisplays();
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: 1920,
        height: 1080
      }
    });

    // Match source by monitorIndex, fallback to primary screen (index 0)
    let selectedSource = sources[0];
    if (monitorIndex !== undefined && monitorIndex < sources.length) {
      selectedSource = sources[monitorIndex];
    }

    if (!selectedSource) {
      return { success: false, error: 'No display monitor screen was detected' };
    }

    const imageBuffer = selectedSource.thumbnail.toPNG();

    // Create a subfolder with today's date (YYYY-MM-DD) inside the chosen folder
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateFolderName = `${year}-${month}-${day}`;
    
    const targetFolder = path.join(folderPath, dateFolderName);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const fullPath = path.join(targetFolder, fileName);
    fs.writeFileSync(fullPath, imageBuffer);

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Screenshot error:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Synchronous save state to file
ipcMain.on('save-state-sync', (event, { key, data }) => {
  try {
    const userDataPath = app.getPath('userData');
    const storageDir = path.join(userDataPath, 'btb_storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    const filePath = path.join(storageDir, `${key}.json`);
    if (data === null) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    event.returnValue = { success: true };
  } catch (error) {
    console.error(`Error saving state sync for ${key}:`, error);
    event.returnValue = { success: false, error: error.message };
  }
});

// IPC Handler: Synchronous load state from file
ipcMain.on('load-state-sync', (event, { key }) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'btb_storage', `${key}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        let data = JSON.parse(content);

        // Clean up large Base64 audio strings synchronously to avoid IPC payload crash
        let hasLargeAudio = false;
        if (data && typeof data === 'object') {
          const speakers = ['rulesSpeaker1', 'rulesSpeaker2', 'dashboardSpeaker'];
          for (const spKey of speakers) {
            if (data[spKey] && data[spKey].audioUrl && data[spKey].audioUrl.startsWith('data:')) {
              const audioKey = `audio_${spKey}`;
              const audioFilePath = path.join(userDataPath, 'btb_storage', `${audioKey}.json`);
              try {
                fs.writeFileSync(audioFilePath, JSON.stringify({ data: data[spKey].audioUrl }), 'utf8');
                console.log(`Migrated large audio data for ${spKey} from ${key}.json to separate file.`);
              } catch (writeErr) {
                console.error(`Failed to migrate large audio for ${spKey}:`, writeErr);
              }
              data[spKey].audioUrl = `indexeddb://${spKey}`;
              hasLargeAudio = true;
            }
          }
        }

        if (hasLargeAudio) {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        }

        event.returnValue = { success: true, data };
      } catch (parseErr) {
        // Fallback: If not valid JSON, treat as raw string value safely
        event.returnValue = { success: true, data: content };
      }
      return;
    }
    event.returnValue = { success: false, data: null };
  } catch (error) {
    console.error(`Error loading state sync for ${key}:`, error);
    event.returnValue = { success: false, error: error.message };
  }
});

// IPC Handler: Load large audio file asynchronously when requested
ipcMain.handle('load-large-audio', async (event, { spKey }) => {
  try {
    const userDataPath = app.getPath('userData');
    const audioKey = `audio_${spKey}`;
    const audioFilePath = path.join(userDataPath, 'btb_storage', `${audioKey}.json`);
    if (fs.existsSync(audioFilePath)) {
      const content = fs.readFileSync(audioFilePath, 'utf8');
      const parsed = JSON.parse(content);
      return { success: true, data: parsed.data };
    }
    return { success: false, error: 'Audio file not found on disk' };
  } catch (error) {
    console.error(`Error loading large audio for ${spKey}:`, error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Synchronous clear all states
ipcMain.on('clear-all-states-sync', (event) => {
  try {
    const userDataPath = app.getPath('userData');
    const storageDir = path.join(userDataPath, 'btb_storage');
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      for (const file of files) {
        fs.unlinkSync(path.join(storageDir, file));
      }
    }
    event.returnValue = { success: true };
  } catch (error) {
    console.error('Error clearing all states sync:', error);
    event.returnValue = { success: false, error: error.message };
  }
});
