import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import problemRoutes from './routes/problem.route.js';
import communityRoutes from './routes/community.route.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const parseAllowedOrigins = () => {
    const rawOrigins = [
        process.env.ALLOWED_ORIGINS,
        process.env.CORS_ORIGIN,
        process.env.FRONTEND_URL,
    ]
        .filter(Boolean)
        .join(',');

    const configured = rawOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    const fallbackOrigins = [
        'https://codekhana.tech',
        'https://www.codekhana.tech',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    ];

    return new Set(configured.length ? configured : fallbackOrigins);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

mongoose.connect(process.env.MONGO).then(() => {
    console.log('MongoDB connected!');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});
 
const app = express();

app.set('trust proxy', 1); 

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.ENABLE_TEST_COOKIE_ROUTE === 'true') {
    app.get('/test-cookie', (req, res) => {
        res.cookie('test', 'working', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 10 * 60 * 1000,
        });
        res.status(200).send('cookie set');
    });
}

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CodeKhana API is running'
    });
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/community", communityRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode,
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server is running on port 3000!');
});