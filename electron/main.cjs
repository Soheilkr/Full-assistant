const { app, BrowserWindow, ipcMain, desktopCapturer, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 750,
    minWidth: 150,
    minHeight: 100,
    useContentSize: true,
    autoHideMenuBar: true,
    frame: true,
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

  win.on('closed', () => {
    win = null;
  });
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

// Helper for state file persistence
const userDataPath = app.getPath('userData');
const stateFilePath = path.join(userDataPath, 'app_state.json');

function loadStateFile() {
  try {
    if (fs.existsSync(stateFilePath)) {
      return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load state file:', err);
  }
  return {};
}

function saveStateFile(data) {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save state file:', err);
  }
}

// 1. Fold / Unfold & Window Dimensions
ipcMain.on('set-window-collapsed', (event, { collapsed, dims }) => {
  if (!win) return;
  const unfoldedW = Number(dims?.unfoldedWidth) || 400;
  const unfoldedH = Number(dims?.unfoldedHeight) || 750;
  const foldedW = Number(dims?.foldedWidth) || 200;
  const foldedH = Number(dims?.foldedHeight) || 120;

  if (collapsed) {
    win.setContentSize(foldedW, foldedH, true);
  } else {
    win.setContentSize(unfoldedW, unfoldedH, true);
  }
});

// 2. Always On Top
ipcMain.on('set-always-on-top', (event, alwaysOnTop) => {
  if (!win) return;
  win.setAlwaysOnTop(!!alwaysOnTop, 'floating');
});

// 3. Restore Window
ipcMain.on('restore-window', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

// 4. Update Active Trade State
ipcMain.on('update-active-trade-state', (event, isActive) => {
  // Active trade status hook
});

// 5. Select Directory Dialog
ipcMain.handle('select-directory', async () => {
  if (!win) return { success: false };
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { success: false };
  }
  return { success: true, path: result.filePaths[0] };
});

// 6. Save Excel File
ipcMain.handle('save-excel-file', async (event, { folderPath = 'C:\\BtbExcelExports', fileName, csvContent }) => {
  try {
    const dateMatch = fileName ? fileName.match(/^(\d{4}-\d{2}-\d{2})/) : null;
    const dateFolder = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    
    let targetFolder = folderPath;
    if (!folderPath.endsWith(dateFolder)) {
      targetFolder = path.join(folderPath, dateFolder);
    }

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const savePath = path.join(targetFolder, fileName || `export_${Date.now()}.csv`);
    fs.writeFileSync(savePath, csvContent, 'utf8');
    return { success: true, path: savePath };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

// 7. Take Screenshot with Daily Subfolder and Watermark
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

    const rawImage = targetSource.thumbnail.toPNG();
    const rawBase64 = 'data:image/png;base64,' + rawImage.toString('base64');

    // Extract Date Folder (e.g. "2026-07-25")
    const dateMatch = fileName ? fileName.match(/^(\d{4}-\d{2}-\d{2})/) : null;
    const dateFolder = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

    // Ensure Daily Subfolder
    let targetFolder = folderPath;
    if (!folderPath.endsWith(dateFolder)) {
      targetFolder = path.join(folderPath, dateFolder);
    }

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Prepare info text for watermark
    const timeNow = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const strategyName = fileName.includes('btb') ? 'BTB Strategy' : fileName.includes('spike') ? 'Spike Strategy' : 'Channel Strategy';
    const watermarkInfo = `${strategyName} | ${dateFolder} ${timeNow}`;

    // Apply Watermark via Canvas overlay in renderer
    let finalImageBuffer = rawImage;
    if (win && !win.isDestroyed()) {
      try {
        const script = `
          (async function() {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(img, 0, 0);

                const fontSize = Math.max(20, Math.round(img.height / 36));
                ctx.font = 'bold ' + fontSize + 'px sans-serif';
                
                const titleText = "Soheil Keshtkar | Full Assistant";
                const infoText = "${watermarkInfo.replace(/"/g, '\\"').replace(/\\/g, '\\\\')}";
                
                const m1 = ctx.measureText(titleText);
                ctx.font = 'normal ' + Math.round(fontSize * 0.8) + 'px sans-serif';
                const m2 = ctx.measureText(infoText);
                const maxTextWidth = Math.max(m1.width, m2.width);
                
                const paddingX = Math.round(fontSize * 0.9);
                const paddingY = Math.round(fontSize * 0.7);
                const bgWidth = maxTextWidth + (paddingX * 2);
                const bgHeight = (fontSize * 2.1) + (paddingY * 2);
                
                const margin = Math.round(fontSize * 0.8);
                const x = img.width - bgWidth - margin;
                const y = img.height - bgHeight - margin;

                ctx.save();
                ctx.fillStyle = 'rgba(8, 10, 20, 0.90)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                if (ctx.roundRect) {
                  ctx.roundRect(x, y, bgWidth, bgHeight, 12);
                } else {
                  ctx.rect(x, y, bgWidth, bgHeight);
                }
                ctx.fill();

                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.restore();

                ctx.fillStyle = '#f8fafc';
                ctx.font = 'bold ' + fontSize + 'px sans-serif';
                ctx.fillText(titleText, x + paddingX, y + paddingY + fontSize * 0.8);

                ctx.fillStyle = '#f59e0b';
                ctx.font = '600 ' + Math.round(fontSize * 0.8) + 'px sans-serif';
                ctx.fillText(infoText, x + paddingX, y + paddingY + fontSize * 1.9);

                resolve(canvas.toDataURL('image/png').split(',')[1]);
              };
              img.onerror = () => resolve("");
              img.src = "${rawBase64}";
            });
          })()
        `;
        const watermarkedBase64 = await win.webContents.executeJavaScript(script);
        if (watermarkedBase64) {
          finalImageBuffer = Buffer.from(watermarkedBase64, 'base64');
        }
      } catch (wErr) {
        console.error('Watermark canvas execution failed, saving raw screenshot:', wErr);
      }
    }

    const savePath = path.join(targetFolder, fileName || `screenshot_${Date.now()}.png`);
    fs.writeFileSync(savePath, finalImageBuffer);

    return { success: true, path: savePath };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

// 8. Synchronous state loading / saving / clearing
ipcMain.on('load-state-sync', (event, key) => {
  const store = loadStateFile();
  event.returnValue = key ? store[key] : store;
});

ipcMain.on('save-state-sync', (event, { key, val }) => {
  const store = loadStateFile();
  if (key) {
    store[key] = val;
  } else if (typeof val === 'object') {
    Object.assign(store, val);
  }
  saveStateFile(store);
  event.returnValue = true;
});

ipcMain.on('clear-all-states-sync', (event) => {
  saveStateFile({});
  event.returnValue = true;
});

// 9. Large audio handling
ipcMain.handle('save-large-audio', async (event, { key, buffer }) => {
  try {
    const audioDir = path.join(userDataPath, 'audio_files');
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    const filePath = path.join(audioDir, `${key}.bin`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-large-audio', async (event, key) => {
  try {
    const filePath = path.join(userDataPath, 'audio_files', `${key}.bin`);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      return { success: true, buffer: buf };
    }
    return { success: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
