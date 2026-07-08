const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let hasActiveTrades = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 365,
    height: 740,
    minWidth: 350,
    minHeight: 400,
    maxWidth: 600,
    maxHeight: 1200,
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
ipcMain.on('set-window-collapsed', (event, collapsed) => {
  if (!mainWindow) return;

  if (collapsed) {
    // Save current width or stick to default 365
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(350, 100);
    mainWindow.setMaximumSize(600, 100);
    mainWindow.setSize(365, 100);
    mainWindow.setResizable(false);
  } else {
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(350, 400);
    mainWindow.setMaximumSize(600, 1200);
    mainWindow.setSize(365, 740);
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

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fullPath = path.join(folderPath, fileName);
    fs.writeFileSync(fullPath, imageBuffer);

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Screenshot error:', error);
    return { success: false, error: error.message };
  }
});
