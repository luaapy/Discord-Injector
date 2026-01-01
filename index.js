import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { findDiscordPath } from './src/finder.js';
import { killDiscord } from './src/process.js';
import { injectDiscord, restoreDiscord } from './src/injector.js';
import { startServer } from './src/websocket.js';
import { themes } from './src/css/themes/index.js';
import { logger, cleanOldLogs } from './src/logger.js';
import { loadConfig } from './src/config.js';

const program = new Command();
const spinner = ora();

async function getContext() {
    spinner.start('Searching for Discord installation...');
    const path = await findDiscordPath();
    if (!path) {
        spinner.fail('Discord not found!');
        console.log(chalk.yellow('Make sure Discord is installed in the default location.'));
        console.log(chalk.gray('\nSearching in:'));
        console.log(chalk.gray('  Windows: %LOCALAPPDATA%\\Discord'));
        console.log(chalk.gray('  macOS: /Applications/Discord.app'));
        console.log(chalk.gray('  Linux: ~/.config/discord'));
        process.exit(1);
    }
    spinner.succeed(`Discord found: ${chalk.gray(path)}`);
    await logger.info(`Discord found at: ${path}`);
    return path;
}

program
    .name('injector')
    .description('Discord CSS Injector Ultimate')
    .version('2.0.0');

program.command('install')
    .description('Inject custom CSS loader')
    .action(async () => {
        const resourcePath = await getContext();
        const config = await loadConfig();

        const { themeChoice } = await inquirer.prompt([{
            type: 'list',
            name: 'themeChoice',
            message: 'Choose initial theme:',
            choices: [...Object.keys(themes), 'Custom (Blank)']
        }]);

        const cssContent = themes[themeChoice] || '/* Write your CSS here */';

        spinner.start('Killing Discord processes...');
        await killDiscord();
        spinner.succeed('Discord killed.');
        await logger.info('Discord processes killed');

        spinner.start('Injecting...');
        try {
            await injectDiscord(resourcePath, cssContent);
            spinner.succeed('Injection Successful!');
            await logger.success(`Injection completed with theme: ${themeChoice}`);

            console.log(chalk.cyan('\nNext steps:'));
            console.log(chalk.white('  1. Open Discord'));
            console.log(chalk.white('  2. Press Ctrl+Shift+I to open DevTools (optional)'));
            console.log(chalk.white('  3. Check Console for "[Discord Injector]" logs'));
            console.log(chalk.white('  4. Run "npm start editor" to live edit CSS\n'));

            const { openDiscord } = await inquirer.prompt([{
                type: 'confirm',
                name: 'openDiscord',
                message: 'Open Discord now?',
                default: true
            }]);

            if (openDiscord) {
                const { exec } = await import('child_process');
                exec('start discord://');
                console.log(chalk.green('Discord opened!'));
            }
        } catch (err) {
            spinner.fail('Injection failed: ' + err.message);
            await logger.error(`Injection failed: ${err.message}`);
            console.log(chalk.yellow('\nTroubleshooting:'));
            console.log(chalk.gray('  1. Make sure Discord is completely closed'));
            console.log(chalk.gray('  2. Try running as Administrator'));
            console.log(chalk.gray('  3. Check logs in logs/ folder'));
        }
    });

program.command('editor')
    .description('Open Live CSS Editor')
    .action(async () => {
        const resourcePath = await getContext();
        await logger.info('Starting live CSS editor');
        console.log(chalk.cyan('\nTips:'));
        console.log(chalk.gray('  - Changes auto-save and reload in Discord'));
        console.log(chalk.gray('  - Use Ctrl+S to manually save'));
        console.log(chalk.gray('  - Open Discord DevTools (Ctrl+Shift+I) for debugging\n'));
        startServer(resourcePath);
    });

program.command('restore')
    .description('Remove injection & restore original')
    .action(async () => {
        const resourcePath = await getContext();
        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to restore to normal?',
            default: false
        }]);

        if (!confirm) return;

        spinner.start('Killing Discord...');
        await killDiscord();
        spinner.succeed('Discord killed.');

        spinner.start('Restoring...');
        const success = await restoreDiscord(resourcePath);

        if (success) {
            spinner.succeed(chalk.green('Discord restored successfully!'));
            await logger.success('Discord restored to original state');
            console.log(chalk.gray('\nDiscord is back to normal. You can open Discord now.'));
        } else {
            spinner.fail(chalk.red('No injection found to restore.'));
            await logger.warn('No injection found to restore');
        }
    });

program.command('test')
    .description('Test installation and configuration')
    .action(async () => {
        console.log(chalk.cyan('Testing Discord Injector Setup...\n'));

        spinner.start('Test 1: Searching for Discord...');
        const discordPath = await findDiscordPath();
        if (discordPath) {
            spinner.succeed(`Discord found: ${chalk.gray(discordPath)}`);
        } else {
            spinner.fail('Discord not found!');
            return;
        }

        spinner.start('Test 2: Loading config...');
        const config = await loadConfig();
        spinner.succeed(`Config loaded: v${config.version}`);

        const fs = await import('fs-extra');
        const path = await import('path');
        const appFolder = path.default.join(discordPath, 'app');
        const isInjected = fs.default.existsSync(appFolder);

        if (isInjected) {
            console.log(chalk.green('Discord is currently INJECTED'));
            const cssPath = path.default.join(appFolder, 'custom.css');
            const cssSize = (await fs.default.stat(cssPath)).size;
            console.log(chalk.gray(`   CSS file size: ${cssSize} bytes`));
        } else {
            console.log(chalk.yellow('Discord is NOT injected'));
            console.log(chalk.gray('   Run "npm start install" to inject'));
        }

        console.log(chalk.cyan('\nAll tests passed!'));
    });

await cleanOldLogs();

program.parse(process.argv);