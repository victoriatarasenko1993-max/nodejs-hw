import 'dotenv/config';
import express from 'express';
import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);
import cors from 'cors';
import { errors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js'; // <-- Додано імпорт
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Глобальні middleware
app.use(logger);
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use(notesRoutes);
app.use(authRoutes);
app.use(userRoutes); // <-- Додано реєстрацію роутера

// 404 — якщо маршрут не знайдено
app.use(notFoundHandler);

// Celebrate — перетворює помилки валідації Joi у відповіді Express
app.use(errors());

// Error — якщо під час запиту виникла помилка
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
