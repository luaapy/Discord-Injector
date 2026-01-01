import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, `injector-${new Date().toISOString().split('T')[0]}.log`);

await fs.ensureDir(LOG_DIR);

export const LogLevel = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS',
    DEBUG: 'DEBUG'
};

function formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
}

async function writeToFile(message) {
    try {
        await fs.appendFile(LOG_FILE, message + '\n');
    } catch (err) {
        console.error('Failed to write log:', err);
    }
}

export async function log(level, message) {
    const formatted = formatMessage(level, message);

    await writeToFile(formatted);

    switch (level) {
        case LogLevel.INFO:
            console.log(chalk.blue(`ℹ ${message}`));
            break;
        case LogLevel.WARN:
            console.log(chalk.yellow(`⚠ ${message}`));
            break;
        case LogLevel.ERROR:
            console.log(chalk.red(`✖ ${message}`));
            break;
        case LogLevel.SUCCESS:
            console.log(chalk.green(`✓ ${message}`));
            break;
        case LogLevel.DEBUG:
            console.log(chalk.gray(`⚙ ${message}`));
            break;
        default:
            console.log(message);
    }
}

export const logger = {
    info: (msg) => log(LogLevel.INFO, msg),
    warn: (msg) => log(LogLevel.WARN, msg),
    error: (msg) => log(LogLevel.ERROR, msg),
    success: (msg) => log(LogLevel.SUCCESS, msg),
    debug: (msg) => log(LogLevel.DEBUG, msg)
};

export async function cleanOldLogs() {
    try {
        const files = await fs.readdir(LOG_DIR);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        for (const file of files) {
            if (!file.endsWith('.log')) continue;

            const filePath = path.join(LOG_DIR, file);
            const stats = await fs.stat(filePath);

            if (now - stats.mtime.getTime() > maxAge) {
                await fs.remove(filePath);
                console.log(chalk.gray(`Removed old log: ${file}`));
            }
        }
    } catch (err) {
        console.error('Failed to clean logs:', err);
    }
}
