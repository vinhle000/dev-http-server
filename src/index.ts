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
import {
  createChirp,
  getAllChirps,
  getChirp,
} from './lib/db/queries/chirps.js';

import { config } from './config.js';
const app = express();
const port = '8080';
const metricsFilePath = 'metrics.txt';

import {
  handleReadiness,
  handleWriteMetricsToFile,
  handleReset,
  handleCreateUser,
  handleLogin,
  handleCreateChirp,
  handleGetAllChirps,
  handleGetChirp,
  handleRefresh,
  handleRevoke,
  handleUpdateUser,
} from './app/handlers.js';

//automated migrations client
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

/* Middleware =============== */
app.use(middlewareLogResponses);
app.use('/app', middlewareMetricInc, express.static('./src/app/'));

app.listen(port, () => {
  console.log(
    `\n\n------ Server is running at http://localhost:${port}---------`
  );
});

app.get('/admin/metrics', handleWriteMetricsToFile);
app.post('/admin/reset', middlewareAuthorizeByPlatform, handleReset);

app.get('/api/healthz', middlewareMetricInc, (req, res, next) => {
  // / - promise implementation of handling async errors with error middleware
  Promise.resolve(handleReadiness(req, res).catch(next));
});

// FOR TESTING - TODO fix
app.get('/api/users/:userId', async (req, res, next) => {
  const { userId } = req.params;
  try {
    const result = await getUserById(userId);

    if (!result) {
      throw new NotFoundError(`User was not found`);
    }
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

app.post('/api/users', express.json(), async (req, res, next) => {
  try {
    await handleCreateUser(req, res);
  } catch (err) {
    next(err);
  }
});

app.put('/api/users', express.json(), async (req, res, next) => {
  try {
    await handleUpdateUser(req, res);
  } catch (err) {
    next(err);
  }
});

app.post('/api/login', express.json(), async (req, res, next) => {
  try {
    await handleLogin(req, res);
  } catch (err) {
    next(err);
  }
});

app.post('/api/refresh', express.json(), async (req, res, next) => {
  try {
    await handleRefresh(req, res);
  } catch (err) {
    next(err);
  }
});
app.post('/api/revoke', express.json(), async (req, res, next) => {
  try {
    // await hanlder function
    await handleRevoke(req, res);
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
app.get('/api/chirps', async (req, res, next) => {
  try {
    await handleGetAllChirps(req, res);
  } catch (err) {
    next(err);
  }
});
app.get('/api/chirps/:chirpID', async (req, res, next) => {
  try {
    await handleGetChirp(req, res);
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);
