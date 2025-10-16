import express, { Request, Response } from 'express';

import {
  middlewareLogResponses,
  middlewareMetricInc,
  errorHandler,
  NotFoundError,
  MessageTooLongError,
  middlewareAuthorizeByPlatform,
  type Middleware,
} from './app/middleware.js';

// Model DB functions
import {
  createUser,
  getUserById,
  deleteAllUsers,
} from './lib/db/queries/users.js';
import { createChirp } from './lib/db/queries/chirps.js';

import { config } from './config.js';
const app = express();
const port = '8080';
const metricsFilePath = 'metrics.txt';

//automated migrations client
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

/* Middleware =============== */
// app.use(middlewareMetricInc);
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricInc, express.static('./src/app/'));

/* Handlers =================== */
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

const handleReset = async (req: Request, res: Response) => {
  config.fileserverHits = 0;
  console.log(`Successfully reset metrics`);

  const result = await deleteAllUsers();
  console.log(
    ` [D] ---- handle reset > deleteAllUsers() result ====  ${result}`
  );
  res.sendStatus(200);
};

// TODO: remove
// const handleValidateChirp = async (req: Request, res: Response) => {
//   type parameters = {
//     body: string;
//   };

//   // try {
//   const params: parameters = req.body;
//   const chirpCharacterLimit = 140;
//   const chirpStr = params.body;

//   if (chirpStr.length > chirpCharacterLimit) {
//     throw new MessageTooLongError(`Chirp is too long`);
//     // res.status(400).send({ error: 'Chirp is too long' });
//     // return;
//   }

//   const profaneWords = ['kerfuffle', 'sharbert', 'fornax'];
//   let words = chirpStr.split(' ');
//   let cleanedWords: string[] = [];

//   for (let word of words) {
//     if (profaneWords.includes(word.toLowerCase())) {
//       cleanedWords.push('****');
//     } else {
//       cleanedWords.push(word);
//     }
//   }
//   res.status(200).send({ cleanedBody: cleanedWords.join(' ') });
//   // } catch (err) {
//   //   res.status(500).send({ error: `Someting went wrong` });
//   // }
// };

const handleAddUser = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new Error(`Request is missing 'email' field`);
  }

  const result = await createUser({ email: email });
  console.log(`DDDDDD - result of creatUser() ===> ${JSON.stringify(result)}`);
  if (!result) {
    throw new Error(`Error occurred adding new user`);
  } else {
    res.status(201).send(result);
  }
};

const handleCreateChirp = async (req: Request, res: Response) => {
  const { body, userId } = req.body;

  // TODO - maybe validate user exists in db

  const chirpCharacterLimit = 140;
  const chirpStr = body;

  if (chirpStr.length > chirpCharacterLimit) {
    throw new MessageTooLongError(`Chirp is too long`);
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

  const result = await createChirp(cleanedWords.join(' '), userId);

  if (!result) {
    throw new Error(`Error occurred creating new chirp`);
  } else {
    res.status(201).send(result);
  }
};
/* ----------------------------- */

app.listen(port, () => {
  console.log(`\n\n------ Server is running at http://localhost:${port}`);
});

/* Register handler functions to express app endpoints */
app.get('/admin/metrics', handleWriteMetricsToFile);
app.post('/admin/reset', middlewareAuthorizeByPlatform, handleReset);

// // Catching Errors in Async functions with errorHandler middleware
// // Option 1 - try/catch
// app.post('/api/validate_chirp', express.json(), async (req, res, next) => {
//   try {
//     await handleValidateChirp(req, res);
//   } catch (err) {
//     next(err); // Pass the error to Express
//   }
// });
// / - promise implementation of handling async errors with error middleware
app.get('/api/healthz', middlewareMetricInc, (req, res, next) => {
  Promise.resolve(handleReadiness(req, res).catch(next));
});

// Users

// FOR TESTING - TODO fix
app.get('/api/users/:userId', async (req, res, next) => {
  const { userId } = req.params;
  try {
    const result = await getUserById(userId);
    console.log(
      `DD - result from getting by id ----- > ${JSON.stringify(
        result,
        null,
        2
      )}`
    );
    // if (!result) {
    // TODO: fix and throw error
    //   res.status(404).send({ error: `userId was not found` });
    // }
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});
app.post('/api/users', express.json(), async (req, res, next) => {
  try {
    await handleAddUser(req, res);
  } catch (err) {
    next(err);
  }
});

app.post('/api/chirps', express.json(), async (req, res, next) => {
  try {
    await handleCreateChirp(req, res);
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);
