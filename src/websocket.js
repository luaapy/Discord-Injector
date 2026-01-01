import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import open from 'open';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startServer(resourcePath) {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });
    const port = 8765;

    const cssTarget = path.join(resourcePath, 'app', 'custom.css');

    app.use(express.static(path.join(__dirname, 'editor')));

    app.get('/api/css', async (req, res) => {
        try {
            const css = await fs.readFile(cssTarget, 'utf8');
            res.json({ css });
        } catch (e) {
            res.status(500).json({ error: 'File not found' });
        }
    });

    wss.on('connection', (ws) => {
        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            if (data.type === 'SAVE') {
                await fs.writeFile(cssTarget, data.css);
                console.log(chalk.green(`[Saved] ${new Date().toLocaleTimeString()}`));
            }
        });
    });

    server.listen(port, () => {
        console.log(chalk.cyan(`\nEditor ready at: http://localhost:${port}`));
        console.log(chalk.gray('Press Ctrl+C to stop server'));
        open(`http://localhost:${port}`);
    });
}
