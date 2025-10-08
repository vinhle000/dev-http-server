import express, { Request, Response } from 'express';
import { middlewareLogResponses } from './middleware/logResponses.js';

const app = express();
const port = '8080';
// src/app/index.ts
app.use(middlewareLogResponses);
app.use('/app', express.static('./src/app/'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const handlerReadiness = async function (
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

app.get('/healthz', handlerReadiness);
