const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle screenshot request from renderer
ipcMain.handle('take-screenshot', async (event, { monitorIndex = 0, folderPath = 'C:\\BtbScreenshots', fileName }) => {
  try {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays[monitorIndex] || displays[0];
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(targetDisplay.bounds.width * (targetDisplay.scaleFactor || 1)),
        height: Math.round(targetDisplay.bounds.height * (targetDisplay.scaleFactor || 1))
      }
    });

    const targetSource = sources[monitorIndex] || sources[0];
    if (!targetSource) {
      return { success: false, error: 'Display source not found' };
    }

    const image = targetSource.thumbnail.toPNG();
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const savePath = path.join(folderPath, fileName || `screenshot_${Date.now()}.png`);
    fs.writeFileSync(savePath, image);

    return { success: true, path: savePath };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});
