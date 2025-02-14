import app from './app.js';
import { connectDB } from './config/database.js';
import net from 'node:net';

const findAvailablePort = (basePort) => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.listen(basePort, () => {
            const port = server.address().port;
            server.close(() => {
                resolve(port);
            });
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                findAvailablePort(basePort + 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(err);
            }
        });
    });
};

const startServer = async () => {
    try {
        await connectDB();
        
        const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        const PORT = await findAvailablePort(BASE_PORT);
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
            if (PORT !== BASE_PORT) {
                console.warn(`Default port ${BASE_PORT} was in use. Using port ${PORT} instead.`);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
