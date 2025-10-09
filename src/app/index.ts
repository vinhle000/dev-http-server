import express, { Request, Response } from 'express';
import {
  middlewareLogResponses,
  middlewareMetricInc,
  type Middleware,
} from './middleware.js';
import { writeFile } from 'fs';
import { config } from '../config.js';

const app = express();
const port = '8080';
const metricsFilePath = 'metrics.txt';

/* Middleware =============== */
// app.use(middlewareMetricInc);
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricInc, express.static('./src/app/'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

/* Handler =================== */
const handleReadiness = async function (
  req: Request,
  res: Response
): Promise<void> {
  console.log(` handler readiness `);
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
  });

  const body = 'OK';
  res.send(body);
};

const handleWriteMetricsToFile = async (req: Request, res: Response) => {
  const serverRequestHitCount = config.fileserverHits;
  const data = `Hits: ${serverRequestHitCount}`;

  writeFile(metricsFilePath, data, (err) => {
    if (err) {
      console.error('Error writing file: ', err);
      res.sendStatus(500);
    } else {
      console.log(`Success writing to file at: ${metricsFilePath}`);
      // res.sendStatus(200);

      res.status(200).json(data);
    }
  });
};

const handleResetMetrics = async (req: Request, res: Response) => {
  config.fileserverHits = 0;
  console.log(`Successfully reset metrics`);
  res.sendStatus(200);
  // if writing to file
  // const dataToWrite = `Hits: 0`;
  // writeFile(metricsFilePath, dataToWrite, (err) => {
  //   if (err) {
  //     console.error(`Error writing to file, and resetting metrics`)
  //   } else {
  //     console.log(`Successfully reset metrics `)
  //   }
  // });
};

/* Register hander functions to express app endpoints */
app.get('/healthz', middlewareMetricInc, handleReadiness);
app.get('/metrics', handleWriteMetricsToFile);
app.get('/reset', handleResetMetrics);
