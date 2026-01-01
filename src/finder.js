import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export async function findDiscordPath() {
    const platform = os.platform();
    let basePath = '';

    if (platform === 'win32') {
        basePath = path.join(os.homedir(), 'AppData', 'Local', 'Discord');
    } else if (platform === 'darwin') {
        return '/Applications/Discord.app/Contents/Resources';
    } else {
        basePath = path.join(os.homedir(), '.config', 'discord');
    }

    if (!fs.existsSync(basePath)) return null;

    const dirs = await fs.readdir(basePath);
    const appDirs = dirs.filter(d => d.startsWith('app-')).sort().reverse();

    if (appDirs.length === 0) return null;
    return path.join(basePath, appDirs[0], 'resources');
}
