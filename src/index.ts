import express, { Request, Response } from 'express';
import {
  middlewareLogResponses,
  middlewareMetricInc,
  errorHandler,
  NotFoundError,
  MessageTooLongError,
  type Middleware,
} from './app/middleware.js';
import { config } from './config.js';

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
  // // const hitCountData = serverRequestHitCount}`;
  // const hitCountData = `Hits: ${serverRequestHitCount}`;

  res.set({
    'Content-Type': 'text/html; charset=utf8',
  });
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${serverRequestHitCount} times!</p>
  </body>
</html>`);
};

const handleResetMetrics = async (req: Request, res: Response) => {
  config.fileserverHits = 0;
  console.log(`Successfully reset metrics`);
  res.sendStatus(200);
};

const handleValidateChirp = async (req: Request, res: Response) => {
  type parameters = {
    body: string;
  };

  // try {
  const params: parameters = req.body;
  const chirpCharacterLimit = 140;
  const chirpStr = params.body;

  if (chirpStr.length > chirpCharacterLimit) {
    throw new MessageTooLongError(`Chirp is too long`);
    // res.status(400).send({ error: 'Chirp is too long' });
    // return;
  }

  const profaneWords = ['kerfuffle', 'sharbert', 'fornax'];
  let words = chirpStr.split(' ');
  let cleanedWords: string[] = [];

  for (let word of words) {
    if (profaneWords.includes(word.toLowerCase())) {
      cleanedWords.push('****');
    } else {
      cleanedWords.push(word);
    }
  }
  res.status(200).send({ cleanedBody: cleanedWords.join(' ') });
  // } catch (err) {
  //   res.status(500).send({ error: `Someting went wrong` });
  // }
};
app.listen(port, () => {
  console.log(`\n\n------ Server is running at http://localhost:${port}`);
});

/* Register hander functions to express app endpoints */
app.get('/admin/metrics', handleWriteMetricsToFile);
app.post('/admin/reset', handleResetMetrics);

// Catching Errors in Async functions with errorHandler middleware
// Option 1 - try/catch
app.post('/api/validate_chirp', express.json(), async (req, res, next) => {
  try {
    await handleValidateChirp(req, res);
  } catch (err) {
    next(err); // Pass the error to Express
  }
});
//Options 2 - promises
app.get('/api/healthz', middlewareMetricInc, (req, res, next) => {
  Promise.resolve(handleReadiness(req, res).catch(next));
});

app.use(errorHandler);
