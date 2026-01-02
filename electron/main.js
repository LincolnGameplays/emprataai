const { app, BrowserWindow } = require('electron');
const path = require('path');

// Verifica se é ambiente de desenvolvimento
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
    icon: path.join(__dirname, '../public/favicon.ico'), // Ícone do Windows
    show: false, // <--- O SEGREDO: Começa invisível
    frame: true, // Moldura nativa do Windows (Minimizar/Fechar)
    backgroundColor: '#050505', // Cor de fundo do app para não piscar branco
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev // Só abre DevTools em desenvolvimento
    },
    autoHideMenuBar: true // Remove a barra "File, Edit..." (SaaS Experience)
  });

  // 2. Configura a Splash Screen (Logo flutuante)
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true, // <--- JANELA TRANSPARENTE
    frame: false, // Sem bordas
    alwaysOnTop: true,
    icon: path.join(__dirname, '../public/favicon.ico'),
    parent: mainWindow, // Vinculada à principal
    webPreferences: {
        devTools: false
    }
  });

  // 3. Carrega os conteúdos
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Em produção, carrega o index.html gerado pelo Vite
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 4. A Mágica da Transição Perfeita
  // Só mostra a janela principal quando ela estiver PRONTA e CARREGADA
  mainWindow.once('ready-to-show', () => {
    // Dá um tempinho extra (2s) para a Splash exibir a marca (Branding)
    setTimeout(() => {
      // Safe check if splash still exists
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy(); // Fecha splash
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show(); // Mostra app
        mainWindow.maximize(); // Abre tela cheia
      }
    }, 2500);
  });
}

// Impede múltiplas instâncias do app
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
