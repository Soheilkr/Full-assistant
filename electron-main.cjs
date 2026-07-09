const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Dimensions config
const UNFOLD_WIDTH = 1200; // Increased by 20% as requested (originally 1000)
const UNFOLD_HEIGHT = 600;

// Folded state dimensions:
// Width: reduced by 75% (25% of unfolded: 1200 * 0.25 = 300)
// Height: half of unfolded (600 * 0.5 = 300) -> which is exactly 3x the previous 100px fold height!
const FOLD_WIDTH = 300;
const FOLD_HEIGHT = 300;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: UNFOLD_WIDTH,
    height: UNFOLD_HEIGHT,
    frame: false, // Frameless UI for premium modern trading feel
    transparent: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // In production, load the built index.html. In dev, load localhost:3000
  if (process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handler: Window Resize for Fold/Unfold State
ipcMain.on('toggle-collapse', (event, collapsed) => {
  if (!mainWindow) return;

  if (collapsed) {
    // Fold state: Reduce width by 75%, and height is 300px (half of 600px, 3x the old 100px)
    mainWindow.setSize(FOLD_WIDTH, FOLD_HEIGHT);
    mainWindow.setResizable(false);
  } else {
    // Unfold state: Restore full dimensions
    mainWindow.setSize(UNFOLD_WIDTH, UNFOLD_HEIGHT);
    mainWindow.setResizable(true);
  }
});

// IPC Handler: Directory Selection
ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// IPC Handler: Automatic Date-based Screenshot Writer
ipcMain.handle('take-screenshot', async (event, baseDir) => {
  if (!mainWindow) return { success: false, error: 'Window not initialized' };

  try {
    // 1. Calculate today's date directory (YYYY-MM-DD)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateDirName = `${year}-${month}-${day}`;
    
    // Target subfolder path
    const targetDir = path.join(baseDir, dateDirName);

    // 2. Automate creating directory if it doesn't exist (recursive)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 3. Take native screenshot of the Electron window
    const image = await mainWindow.webContents.capturePage();
    const pngBuffer = image.toPNG();

    // 4. Generate unique timestamped filename
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const filename = `screenshot_${hour}-${min}-${sec}.png`;
    const finalPath = path.join(targetDir, filename);

    // 5. Write binary PNG data to directory
    fs.writeFileSync(finalPath, pngBuffer);

    return { 
      success: true, 
      path: finalPath 
    };
  } catch (error) {
    console.error('Failed to take screenshot:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred during screenshot write' 
    };
  }
});

ipcMain.on('close-app', () => {
  app.quit();
});

ipcMain.on('minimize-app', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
