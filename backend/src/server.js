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
    // Connect to database
    await connectDB();
        
    const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const PORT = await findAvailablePort(BASE_PORT);
        
    app.listen(PORT, '0.0.0.0', () => {
      // Styled console logs with color and formatting
      console.log('\x1b[1m\x1b[32m' + '🚀 Server Startup Complete' + '\x1b[0m');
      console.log('\x1b[34m' + '----------------------------' + '\x1b[0m');
      console.log('\x1b[36m' + `📡 Server Running on : http://localhost:${PORT}` + '\x1b[0m');
            
      // Environment information
      console.log('\x1b[33m' + `🌐 Environment: ${process.env.NODE_ENV || 'development'}` + '\x1b[0m');
            
      // Port usage warning if different from base port
      if (PORT !== BASE_PORT) {
        console.warn(
          '\x1b[33m' + 
                    `⚠️  Port ${BASE_PORT} was in use. Automatically switched to port ${PORT}` + 
                    '\x1b[0m'
        );
      }
            
      // Additional server startup information
      console.log('\x1b[35m' + '🕒 Startup Time: ' + new Date().toLocaleString() + '\x1b[0m');
      console.log('\x1b[34m' + '----------------------------' + '\x1b[0m');
    });
  } catch (error) {
    // Enhanced error logging
    console.error('\x1b[1m\x1b[31m' + '🛑 Server Startup Failed' + '\x1b[0m');
    console.error('\x1b[31m' + `Error Details: ${error.message}` + '\x1b[0m');
    console.error('\x1b[31m' + `Stack Trace: ${error.stack}` + '\x1b[0m');
    process.exit(1);
  }
};

startServer();
