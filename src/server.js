import 'dotenv/config';
import express from 'express';
import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);
import cors from 'cors';
import helmet from 'helmet';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';
import { errors } from 'celebrate';


const app = express();
const PORT = process.env.PORT || 3000;

// Глобальні middleware
app.use(logger);         // 1. Логер першим — бачить усі запити
app.use(express.json()); // 2. Парсинг JSON-тіла
app.use(cors());         // 3. Дозвіл для запитів з інших доменів
app.use(helmet());       // 4. Безпека для HTTP-заголовків
app.use(notesRoutes);

// 404 — якщо маршрут не знайдено
app.use(notFoundHandler);

// Error — якщо під час запиту виникла помилка
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
