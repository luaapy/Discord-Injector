import fs from 'fs-extra';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const CONFIG_LOCAL_PATH = path.join(process.cwd(), 'config.local.json');

export async function loadConfig() {
    try {
        const baseConfig = await fs.readJson(CONFIG_PATH);

        if (await fs.pathExists(CONFIG_LOCAL_PATH)) {
            const localConfig = await fs.readJson(CONFIG_LOCAL_PATH);
            return { ...baseConfig, ...localConfig };
        }

        return baseConfig;
    } catch (err) {
        console.error('Failed to load config:', err);
        return getDefaultConfig();
    }
}

export async function saveConfig(config) {
    try {
        await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
        return true;
    } catch (err) {
        console.error('Failed to save config:', err);
        return false;
    }
}

export async function updateConfig(key, value) {
    const config = await loadConfig();

    const keys = key.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    return await saveConfig(config);
}

function getDefaultConfig() {
    return {
        version: '2.0.0',
        settings: {
            autoBackup: true,
            maxBackups: 10,
            enableLogging: true,
            hotReload: true,
            editorPort: 8765
        },
        paths: {
            backups: './backups',
            logs: './logs',
            themes: './src/css/themes'
        },
        discord: {
            autoRestart: false,
            killTimeout: 2000
        },
        editor: {
            theme: 'vs-dark',
            fontSize: 14,
            tabSize: 2,
            autoSave: true,
            autoSaveDelay: 1000
        }
    };
}
