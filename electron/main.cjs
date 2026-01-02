const { app, BrowserWindow } = require('electron');
const path = require('path');

// Verifica se é ambiente de desenvolvimento
// Nota: Em .cjs, import.meta.env não existe, usamos process.env
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let splashWindow;

function createWindows() {
  // 1. Configura a Janela Principal (Oculta inicialmente)
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "EmprataAI Enterprise",
    // IMPORTANTE: O caminho do ícone deve ser absoluto ou relativo correto
    icon: path.join(__dirname, '../public/favicon.ico'), 
    show: false, // Começa invisível para não piscar branco
    frame: true, 
    backgroundColor: '#050505',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev
    },
    autoHideMenuBar: true
  });

  // 2. Configura a Splash Screen (Logo flutuante)
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    // Ícone da barra de tarefas durante o carregamento
    icon: path.join(__dirname, '../public/favicon.ico'), 
    parent: mainWindow,
    webPreferences: {
        devTools: false
    }
  });

  // Carrega o HTML da Splash
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  // 3. Carrega o App React
  if (isDev) {
    // Em dev, espera o Vite subir na porta 5173
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Em produção, carrega o arquivo buildado
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 4. Transição Suave
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.maximize();
      }
    }, 2500); // 2.5s de exibição da marca
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindows);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
