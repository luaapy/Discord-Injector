import fs from 'fs-extra';
import path from 'path';

export async function createBackup(filePath) {
    if (fs.existsSync(filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(process.cwd(), 'backups', `${path.basename(filePath)}.${timestamp}.bak`);

        await fs.ensureDir(path.dirname(backupPath));
        await fs.copy(filePath, backupPath);
        return backupPath;
    }
    return null;
}
