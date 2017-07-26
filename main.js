/*global __dirname, process, require */

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const { Router } = require('electron-routes');
const fs = require('fs-extra');
const marked = require('marked');

const FILES_DIR = 'files';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const capitalize = string => string.charAt(0).toUpperCase() + string.substring(1);

const api = new Router('wiki');

api.get('/exists/:page', (req, res) => {
  // Check if the file for that page exists
  var filename = capitalize(decodeURI(req.params.page));
  var filepath = path.join(app.getPath('userData'), FILES_DIR, `${filename}.md`);
  var exists = fs.existsSync(filepath);
  res.json({ exists });
});

api.get('/get/:page', (req, res) => {
  // Check if the file for that page exists
  var filename = capitalize(decodeURI(req.params.page));
  var filepath = path.join(app.getPath('userData'), FILES_DIR, `${filename}.md`);
  var exists = fs.existsSync(filepath);

  if (exists) {
    // If it does, serve it
    fs.readFile(filepath, 'utf8', function (err, data) {
      if (err) throw err;
      res.json({
        html: marked(data),
        markdown: data,
      });
    });
  } else {
    // If it doesn't, create it and send that
    res.json({
      html: '',
      markdown: '',
    });
  }
});

api.post('/edit/:page', (req, res) => {
  // Check if the file for that page exists
  var filename = capitalize(decodeURI(req.params.page));
  var filepath = path.join(app.getPath('userData'), FILES_DIR, `${filename}.md`);

  // Write the file, regardless of whether it existed previously or not
  fs.writeFile(filepath, req.uploadData[0].json().markdown, 'utf8', function (err) {
    if (err) throw err;
    res.json({});
  });
});

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hidden-inset' })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname:path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  // For debugging purposes
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  // Make the menu
  var template = [{
    label: 'Application',
    submenu: [
      { label: 'About Application', selector: 'orderFrontStandardAboutPanel:' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click: function() { app.quit(); }}
    ]}, {
      label: 'File',
      submenu: [
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          selector: 'save:',
          click: function () {
            var focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('file-save');
            }
          }
        },
      ],
    }, {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// If the _.md file doesn't already exist in teh userData directory, copy it over from resources
var path1 = path.join(app.getPath('userData'), FILES_DIR, '_.md');
if (!fs.existsSync(path1)) {
  var filepath = path.join(process.resourcesPath, FILES_DIR, '_.md');

  fs.copy(filepath, path1);
}