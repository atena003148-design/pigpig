const { spawn, exec } = require('child_process');
const http = require('http');
const net = require('net');

// Find an available port starting from 3000
function getAvailablePort(startPort, callback) {
    const server = net.createServer();
    server.listen(startPort, () => {
        server.once('close', () => callback(startPort));
        server.close();
    });
    server.on('error', () => {
        getAvailablePort(startPort + 1, callback);
    });
}

getAvailablePort(3000, (port) => {
    console.log(`Starting Next.js on port ${port}...`);
    const next = spawn('npx', ['next', 'dev', '-p', port.toString()], { stdio: 'inherit', shell: true });

    let browserOpened = false;

    function checkReady() {
        if (browserOpened) return;
        const req = http.get(`http://localhost:${port}`, (res) => {
            browserOpened = true;
            console.log(`\n> Server is ready! Opening browser at http://localhost:${port}\n`);
            const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
            exec(`${startCmd} http://localhost:${port}`);
        }).on('error', () => {
            setTimeout(checkReady, 500);
        });
        // Next.js might close connections abruptly during compilation, so ignore errors
        req.on('error', () => { });
    }

    // Start polling after 1.5 seconds
    setTimeout(checkReady, 1500);
});
