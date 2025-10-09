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
  // const hitCountData = serverRequestHitCount}`;
  const hitCountData = `Hits: ${serverRequestHitCount}`;

  res.set({
    'Content-Type': 'text/html; charset=utf8',
  });
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${serverRequestHitCount} times!</p>
  </body>
</html>`);
  // writeFile(metricsFilePath, hitCountData, (err) => {
  //   if (err) {
  //     console.error('Error writing file: ', err);
  //     res.sendStatus(500);
  //   } else {
  //     console.log(`Success writing to file at: ${metricsFilePath}`);
  //     // res.sendStatus(200);

  //     res.status(200).json(hitCountData);
  //   }
  // });
};

const handleResetMetrics = async (req: Request, res: Response) => {
  config.fileserverHits = 0;
  console.log(`Successfully reset metrics`);
  res.sendStatus(200);
};

app.listen(port, () => {
  console.log(`\n\n------ Server is running at http://localhost:${port}`);
});

/* Register hander functions to express app endpoints */
app.get('/api/healthz', middlewareMetricInc, handleReadiness);
app.get('/admin/metrics', handleWriteMetricsToFile);
app.get('/admin/reset', handleResetMetrics);
