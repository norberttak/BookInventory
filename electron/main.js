const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const fs = require('fs');

let mainWindow;
let blazorProcess;
let expressApp;
let server;

// Configuration
const isDev = process.env.NODE_ENV === 'development';
const port = 5000;
const blazorUrl = `http://localhost:${port}`;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      // Fix for V8 crashes on macOS
      v8CacheOptions: 'none',
      disableBlinkFeatures: 'AutomationControlled'
    },
    icon: path.join(__dirname, '../wwwroot/favicon.png'),
    show: true, // Show immediately
    center: true, // Center the window
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Add error handling for page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', errorDescription, 'URL:', validatedURL);
    
    // Show a simple error page
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head><title>Loading Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
          <h1>Failed to Load Application</h1>
          <p>Error: ${errorDescription}</p>
          <p>URL: ${validatedURL}</p>
          <button onclick="location.reload()">Retry</button>
          <script>
            setTimeout(() => location.reload(), 5000);
          </script>
        </body>
      </html>
    `);
  });

  // Show dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Add logging for debugging
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  // Load the Blazor application
  if (isDev) {
    console.log('Starting in development mode...');
    // In development, wait for the Blazor server to start
    waitForBlazorServer()
      .then(() => {
        console.log('Loading development URL:', blazorUrl);
        mainWindow.loadURL(blazorUrl);
      })
      .catch((error) => {
        console.error('Failed to start Blazor server:', error);
        mainWindow.show(); // Ensure window is visible even on error
        dialog.showErrorBox('Startup Error', 'Failed to start the development server: ' + error.message);
      });
  } else {
    console.log('Starting in production mode...');
    // In production, start the Blazor application and connect to it
    startBlazorProduction()
      .then(() => {
        return waitForBlazorServer();
      })
      .then(() => {
        console.log('Loading production Blazor URL:', blazorUrl);
        mainWindow.loadURL(blazorUrl);
      })
      .catch((error) => {
        console.error('Failed to start production Blazor:', error);
        mainWindow.show(); // Ensure window is visible even on error
        dialog.showErrorBox('Startup Error', 'Failed to start the application: ' + error.message);
      });
  }

  // Force show window after a delay if it's still not visible
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Forcing window to show...');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);
}

async function waitForBlazorServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const checkServer = (attempt = 0) => {
      if (attempt >= retries) {
        reject(new Error('Blazor server failed to start'));
        return;
      }

      const http = require('http');
      const req = http.request(blazorUrl, { timeout: 1000 }, (res) => {
        resolve();
      });

      req.on('error', () => {
        setTimeout(() => checkServer(attempt + 1), 1000);
      });

      req.on('timeout', () => {
        req.destroy();
        setTimeout(() => checkServer(attempt + 1), 1000);
      });

      req.end();
    };

    checkServer();
  });
}

async function startProductionServer() {
  return new Promise((resolve, reject) => {
    try {
      expressApp = express();
      
      // Determine the correct path for static files
      let staticPath;
      
      console.log('Debug info:');
      console.log('app.isPackaged:', app.isPackaged);
      console.log('__dirname:', __dirname);
      console.log('process.resourcesPath:', process.resourcesPath);
      console.log('app.getAppPath():', app.getAppPath());
      console.log('process.cwd():', process.cwd());
      
      // In packaged app, files are in different locations
      if (app.isPackaged) {
        // Try multiple possible locations for the wwwroot folder
        const possiblePaths = [
          // extraResources location (most likely)
          path.join(process.resourcesPath, 'wwwroot'),
          
          // Standard asar unpacked locations
          path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'wwwroot'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'wwwroot'),
          
          // Alternative unpacked locations
          path.join(__dirname, '..', 'wwwroot'),
          path.join(__dirname, '..', '..', 'wwwroot'),
          path.join(__dirname, '..', 'dist', 'wwwroot'),
          
          // Direct in resources
          path.join(process.resourcesPath, 'dist', 'wwwroot'),
          
          // App path locations
          path.join(app.getAppPath(), 'wwwroot'),
          path.join(app.getAppPath(), 'dist', 'wwwroot'),
          
          // Process working directory
          path.join(process.cwd(), 'wwwroot'),
          path.join(process.cwd(), 'dist', 'wwwroot')
        ];
        
        console.log('Searching for wwwroot in these locations:');
        for (const testPath of possiblePaths) {
          console.log(`  Checking: ${testPath}`);
          if (fs.existsSync(testPath)) {
            staticPath = testPath;
            console.log(`✓ Found static files at: ${staticPath}`);
            break;
          } else {
            console.log(`  ✗ Not found`);
          }
        }
        
        if (!staticPath) {
          console.error('Could not find wwwroot directory in packaged app');
          
          // List contents of common directories for debugging
          const debugPaths = [
            process.resourcesPath,
            path.join(process.resourcesPath, 'app.asar.unpacked'),
            __dirname,
            path.dirname(__dirname),
            app.getAppPath()
          ];
          
          for (const debugPath of debugPaths) {
            if (fs.existsSync(debugPath)) {
              try {
                const contents = fs.readdirSync(debugPath);
                console.log(`Contents of ${debugPath}:`, contents);
              } catch (err) {
                console.log(`Could not read ${debugPath}:`, err.message);
              }
            } else {
              console.log(`${debugPath} does not exist`);
            }
          }
          
          reject(new Error('Static files not found'));
          return;
        }
      } else {
        // In development, use multiple possible paths
        const devPaths = [
          path.join(__dirname, '..', 'wwwroot'),
          path.join(__dirname, '..', 'dist', 'wwwroot'),
          path.join(process.cwd(), 'wwwroot'),
          path.join(process.cwd(), 'dist', 'wwwroot')
        ];
        
        for (const testPath of devPaths) {
          if (fs.existsSync(testPath)) {
            staticPath = testPath;
            console.log(`Found development static files at: ${staticPath}`);
            break;
          }
        }
        
        if (!staticPath) {
          console.error('Could not find wwwroot directory in development');
          reject(new Error('Development static files not found'));
          return;
        }
      }
      
      console.log(`Serving static files from: ${staticPath}`);
      
      // Verify the path exists
      if (!fs.existsSync(staticPath)) {
        console.error(`Static path does not exist: ${staticPath}`);
        reject(new Error(`Static path does not exist: ${staticPath}`));
        return;
      }
      
      // List contents for debugging
      try {
        const contents = fs.readdirSync(staticPath);
        console.log('Static directory contents:', contents);
      } catch (err) {
        console.error('Error reading static directory:', err);
      }
      
      expressApp.use(express.static(staticPath));

      // Handle SPA routing - redirect all requests to index.html
      expressApp.get('*', (req, res) => {
        const indexPath = path.join(staticPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error(`index.html not found at: ${indexPath}`);
          res.status(404).send('index.html not found');
        }
      });

      server = expressApp.listen(port, 'localhost', () => {
        console.log(`Production server running on ${blazorUrl}`);
        resolve();
      });

      server.on('error', (err) => {
        console.error('Production server error:', err);
        reject(err);
      });

    } catch (error) {
      console.error('Failed to start production server:', error);
      reject(error);
    }
  });
}

function startBlazorDev() {
  if (!isDev) return;

  try {
    // Start the Blazor development server
    blazorProcess = spawn('dotnet', ['run'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    blazorProcess.stdout.on('data', (data) => {
      console.log(`Blazor: ${data}`);
    });

    blazorProcess.stderr.on('data', (data) => {
      console.error(`Blazor Error: ${data}`);
    });

    blazorProcess.on('close', (code) => {
      console.log(`Blazor process exited with code ${code}`);
    });

  } catch (error) {
    console.error('Failed to start Blazor development server:', error);
    dialog.showErrorBox('Startup Error', 'Failed to start the application server.');
  }
}

function startBlazorProduction() {
  return new Promise((resolve, reject) => {
    try {
      // Find the Blazor executable
      const possibleExePaths = [
        // extraResources location (most likely with new config)
        path.join(process.resourcesPath, 'dist', 'BookInventory'),
        path.join(process.resourcesPath, 'dist', 'BookInventory.exe'),
        
        // asar unpacked locations (fallback)
        path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'BookInventory'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'BookInventory.exe'),
        
        // Development and other fallback locations
        path.join(__dirname, '..', 'dist', 'BookInventory'),
        path.join(__dirname, '..', 'dist', 'BookInventory.exe'),
        path.join(process.cwd(), 'dist', 'BookInventory'),
        path.join(process.cwd(), 'dist', 'BookInventory.exe')
      ];

      let exePath = null;
      for (const testPath of possibleExePaths) {
        if (fs.existsSync(testPath)) {
          exePath = testPath;
          console.log(`Found Blazor executable at: ${exePath}`);
          break;
        }
      }

      if (!exePath) {
        console.error('Blazor executable not found. Checked paths:');
        possibleExePaths.forEach(p => console.log(`  ${p}: ${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`));
        
        // Additional debugging - list contents of resources directory
        console.log('Debug - Contents of process.resourcesPath:', process.resourcesPath);
        try {
          const resourcesContents = fs.readdirSync(process.resourcesPath);
          console.log('Resources directory contents:', resourcesContents);
          
          // Check if dist exists and list its contents
          const distPath = path.join(process.resourcesPath, 'dist');
          if (fs.existsSync(distPath)) {
            const distContents = fs.readdirSync(distPath);
            console.log('Dist directory contents:', distContents);
          }
        } catch (err) {
          console.log('Could not read resources directory:', err.message);
        }
        
        reject(new Error('Blazor executable not found'));
        return;
      }

      // Set environment variables
      const env = { ...process.env };
      env.URLS = `http://localhost:${port}`;
      env.ELECTRON_APP = 'true';

      // Start the Blazor production server
      blazorProcess = spawn(exePath, [], {
        cwd: path.dirname(exePath),
        stdio: 'pipe',
        env: env
      });

      blazorProcess.stdout.on('data', (data) => {
        console.log(`Blazor Production: ${data}`);
      });

      blazorProcess.stderr.on('data', (data) => {
        console.error(`Blazor Production Error: ${data}`);
      });

      blazorProcess.on('close', (code) => {
        console.log(`Blazor production process exited with code ${code}`);
      });

      blazorProcess.on('error', (error) => {
        console.error('Blazor production process error:', error);
        reject(error);
      });

      // Give the process a moment to start
      setTimeout(() => {
        resolve();
      }, 2000);

    } catch (error) {
      console.error('Failed to start Blazor production server:', error);
      reject(error);
    }
  });
}

// Fix for macOS V8 crashes - disable problematic features
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-web-security');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
}

// App event handlers
app.whenReady().then(() => {
  console.log('Electron app ready');
  
  if (isDev) {
    console.log('Starting Blazor development server...');
    startBlazorDev();
  }
  
  console.log('Creating main window...');
  createWindow();

  app.on('activate', () => {
    console.log('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('No windows found, creating new window...');
      createWindow();
    } else if (mainWindow) {
      console.log('Bringing existing window to front...');
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Clean up processes
  if (blazorProcess) {
    blazorProcess.kill();
  }
  if (server) {
    server.close();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && url.startsWith('https://localhost')) {
    // In development, ignore certificate errors for localhost
    event.preventDefault();
    callback(true);
  } else {
    // Use default behavior in production
    callback(false);
  }
});

// Auto-updater events (for future use)
if (!isDev) {
  // Add auto-updater logic here if needed
}

// Debugging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});