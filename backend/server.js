const express = require('express');
require('express-async-errors');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const profileFieldsRoutes = require('./routes/profileFields');
const adminRoutes = require('./routes/admin');
const semesterRoutes = require('./routes/semester');
const mentorGradingRouter = require('./routes/mentorGradingSchema');
const superAdminRoutes = require("./routes/superadmin");
const principalRoutes = require("./routes/principal");
const masterRoutes = require("./routes/master");


dotenv.config();
const app = express();

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));

// Set security headers
app.use(helmet());

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sanitize data (NoSQL injection prevention)
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Admin, auth, profile endpoints specifically can have these or apply globally 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
// Connect to DB
connectDB();

// Routes
app.get('/test', (req, res) => {
    res.send('API is running...');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile-fields', profileFieldsRoutes);
app.use('/api/semester', semesterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentorGrading', mentorGradingRouter);

app.use("/api/superadmin", superAdminRoutes);
app.use("/api/principal", principalRoutes);
app.use("/api/master", masterRoutes);

// Centralized Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ 
            success: false, 
            error: messages.join(', ') 
        });
    }

    // Mongoose Cast Error (Invalid ID)
    if (err.name === 'CastError') {
        return res.status(400).json({ 
            success: false, 
            error: `Resource not found with id of ${err.value}` 
        });
    }

    // Mongoose Duplicate Key
    if (err.code === 11000) {
        return res.status(400).json({ 
            success: false, 
            error: 'Duplicate field value entered' 
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections (e.g. database failure)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
