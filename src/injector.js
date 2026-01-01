import fs from 'fs-extra';
import path from 'path';
import { createBackup } from './backup.js';

export async function injectDiscord(resourcePath, initialCSS) {
    const appFolder = path.join(resourcePath, 'app');
    const appAsarPath = path.join(resourcePath, 'app.asar');
    const originalAsarPath = path.join(resourcePath, 'original.asar');

    //Backup app.asar → original.asar (if not exists)
    if (fs.existsSync(appAsarPath) && !fs.existsSync(originalAsarPath)) {
        console.log('Renaming app.asar → original.asar...');
        await fs.rename(appAsarPath, originalAsarPath);
        await createBackup(appAsarPath);
    }

    await fs.ensureDir(appFolder);

    const cssPath = path.join(appFolder, 'custom.css');
    await fs.writeFile(cssPath, initialCSS);
    console.log('CSS file created');

    await fs.writeJson(path.join(appFolder, 'package.json'), {
        name: "discord-injector",
        main: "index.js"
    });

    const scriptContent = `
const electron = require('electron');
const path = require('path');
const fs = require('fs');

electron.app.on('browser-window-created', (_, window) => {
    window.webContents.on('dom-ready', () => {
        const cssPath = path.join(__dirname, 'custom.css');
        
        const loadCSS = () => {
            try {
                if (window.isDestroyed()) return;
                
                if (fs.existsSync(cssPath)) {
                    const css = fs.readFileSync(cssPath, 'utf8');
                    window.webContents.insertCSS(css);
                    console.log('[Discord nc] CSS loaded successfully');
                } else {
                    console.warn('[Discord nc] CSS file not found:', cssPath);
                }
            } catch (error) {
                console.error('[Discord nc] Error loading CSS:', error);
            }
        };

        loadCSS();

        const watcher = fs.watchFile(cssPath, { interval: 1000 }, () => {
            try {
                if (!window.isDestroyed() && window.webContents) {
                    console.log('[Discord nc] CSS file changed, reloading...');
                    window.webContents.reload();
                }
            } catch (error) {
                console.error('[Discord nc] Error during reload:', error);
            }
        });

        window.on('closed', () => {
            try {
                fs.unwatchFile(cssPath);
                console.log('[Discord nc] Cleanup: File watcher stopped');
            } catch (error) {
            }
        });
    });
});

const originalAsar = path.join(process.resourcesPath, 'original.asar');
if (fs.existsSync(originalAsar)) {
    require(originalAsar);
} else {
    console.error('[Discord nc] original.asar not found! Injection failed.');
}
    `;

    await fs.writeFile(path.join(appFolder, 'index.js'), scriptContent);
    console.log('Injection script created');

    return true;
}

export async function restoreDiscord(resourcePath) {
    const appFolder = path.join(resourcePath, 'app');
    const appAsarPath = path.join(resourcePath, 'app.asar');
    const originalAsarPath = path.join(resourcePath, 'original.asar');

    let restored = false;

    if (fs.existsSync(appFolder)) {
        console.log('Removing app folder...');
        await fs.remove(appFolder);
        restored = true;
    }

    //Restore original.asar → app.asar
    if (fs.existsSync(originalAsarPath)) {
        console.log('Restoring original.asar → app.asar...');

        // Remove app.asar if exists (shouldn't exist)
        if (fs.existsSync(appAsarPath)) {
            await fs.remove(appAsarPath);
        }

        // Rename back
        await fs.rename(originalAsarPath, appAsarPath);
        console.log('app.asar restored');
        restored = true;
    }

    return restored;
}
