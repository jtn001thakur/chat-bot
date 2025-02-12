import app from './app.js';
import { connectDB } from './config/database.js';

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});
