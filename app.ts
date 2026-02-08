import cors from 'cors';
import express from 'express';

import router from './routes/routes';
import config from './server/config';
import { errorHandler, notFoundHandler } from './server/http';

const app = express();
const allowAllOrigins = config.corsOrigins.includes('*');

app.use(
  cors({
    origin(origin, callback) {
      if (allowAllOrigins || !origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin is not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'zk-qrcode-api',
  });
});

app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`zk-qrcode API listening on port ${config.port}`);
});
