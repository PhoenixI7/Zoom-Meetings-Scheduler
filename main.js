const { app, BrowserWindow, Tray, application, Menu, ipcMain } = require('electron');
const path = require('path');

function timer(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow = null;
let tray;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  })

  // Create myWindow, load the rest of the app, etc...
  app.on('ready', () =>  createWindow())
}

ipcMain.on('load-zoom-link', async (event, arg) => {
  console.log(arg);
  let zoomWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    icon:'logo.ico',
    alwaysOnTop: true,
    show: false
  });
  zoomWindow.loadURL(arg);

  await timer(2000);
  zoomWindow.destroy();
  event.reply('asynchronous-reply', 'pong');

});

const createWindow = () => {
  const assetsPath = app.isPackaged ? path.join(process.resourcesPath, "assets") : "assets";
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    // resizable: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: assetsPath + '/logo.ico'
  });
  
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, '/src/index.html'));
  mainWindow.webContents.on("devtools-opened", () => mainWindow.webContents.closeDevTools());

  mainWindow.on('minimize', e => {
      e.preventDefault();
      mainWindow.hide();
  });

  mainWindow.on('close', e => {
      e.preventDefault();
      mainWindow.hide();
      return false;
  });

  tray = new Tray(assetsPath + '/logo.ico');
  tray.setToolTip('Auto-Open Zoom Meetings');
  tray.on('click', () => mainWindow.show());
  let contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow.show() },
      { label: 'Quit', click: () => {
          mainWindow.destroy();
          app.quit();
        } 
      }
  ]);

  tray.setContextMenu(contextMenu);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});