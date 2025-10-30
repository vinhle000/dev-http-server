import express, { Request, Response } from 'express';

import {
  NotFoundError,
  MessageTooLongError,
  type Middleware,
  UnauthorizedError,
} from './middleware.js';
import {
  makeJWT,
  validateJWT,
  hashPassword,
  checkPasswordHash,
  getBearerToken,
  makeRefreshToken,
} from '../lib/auth.js';
// Model DB functions
import {
  createUser,
  getUserByEmail,
  getUserById,
  deleteAllUsers,
  updateUserCredentials,
  updateUserChirpRedStatus,
} from '../lib/db/queries/users.js';
import {
  createChirp,
  getAllChirps,
  getChirp,
  deleteChirp,
} from '../lib/db/queries/chirps.js';
import {
  getRefreshToken,
  getUserFromRefreshToken,
  revokeRefreshToken,
} from '../lib/db/queries/refreshTokens.js';
import { config } from '../config.js';

import { NewUser, RefreshToken } from '../lib/db/schema.js';
type UserResponse = Omit<NewUser, 'hashedPassword'>;

process.loadEnvFile();

export const handleReadiness = async function (
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

export const handleWriteMetricsToFile = async (req: Request, res: Response) => {
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

export const handleReset = async (req: Request, res: Response) => {
  config.fileserverHits = 0;
  console.log(`Successfully reset metrics`);

  const result = await deleteAllUsers();
  console.log(
    ` [D] ---- handle reset > deleteAllUsers() result ====  ${result}`
  );
  res.sendStatus(200);
};

export const handleCreateUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error(`Request is missing 'email' or 'password`);
  }

  const hashedPassword = await hashPassword(password);

  const result = await createUser({
    email: email,
    hashedPassword: hashedPassword,
  });

  console.log(`DDDDDD - result of createUser() ===> ${JSON.stringify(result)}`);

  if (!result) {
    throw new Error(`Error occurred creating new user`);
  } else {
    const newUserResponse: UserResponse = {
      id: result.id,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      email: result.email,
      isChirpyRed: result.isChirpyRed,
    };
    res.status(201).send(newUserResponse);
  }
};

export const handleGetUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await getUserById(userId);
  if (!result) {
    throw new NotFoundError(`User was not found`);
  }
  return result;
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  console.log(`\n\n--------\n${password}`);
  if (!user || !(await checkPasswordHash(user.hashedPassword, password))) {
    throw new UnauthorizedError(`Incorrect email or password`);
  }
  let expTime: number = 3600;

  // jwt token always set to expire after 1 hour
  // if (!expTime || expTime > 3600) {
  //   expTime = 3600; //seconds in an hour, defaults to 1 hour
  // }

  const jwtToken = makeJWT(user.id, expTime, config.jwtSecret);
  const refreshToken: RefreshToken = await makeRefreshToken(user.id); // should return refresh token obj

  const userResponse: UserResponse = {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    isChirpyRed: user.isChirpyRed,
  };
  // attach created jwt and refreshToken to userResponse
  res
    .status(200)
    .send({ ...userResponse, token: jwtToken, refreshToken: refreshToken.id }); // add generated jwt token
};

export const handleRefresh = async (req: Request, res: Response) => {
  const refreshTokenHexString = await getBearerToken(req);

  const refreshToken: RefreshToken = await getRefreshToken(
    refreshTokenHexString
  );

  if (
    !refreshToken ||
    refreshToken.revokedAt !== null ||
    refreshToken.expiresAt.getTime() <= Date.now()
  ) {
    throw new UnauthorizedError(`Invalid refresh token`);
  }

  const user = await getUserFromRefreshToken(refreshToken.id);

  let expTime: number = 3600; //NOTE: can remove and make the makeJWT default to 1 hour exp time
  const jwtToken = await makeJWT(user.id, expTime, config.jwtSecret);

  res.status(200).send({ token: jwtToken });
};
export const handleRevoke = async (req: Request, res: Response) => {
  const refreshTokenHexString = getBearerToken(req);
  const revokedToken: RefreshToken = await revokeRefreshToken(
    refreshTokenHexString
  );
  if (!revokedToken) {
    throw new UnauthorizedError('invalid refresh token');
  }

  res.sendStatus(204);
  // db query to revoke the record
};

export const handleCreateChirp = async (req: Request, res: Response) => {
  const { body } = req.body;

  // NOTE - maybe validate user exists in db
  const userJwt = await getBearerToken(req);
  const validatedUserId = validateJWT(userJwt, config.jwtSecret);

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

  const result = await createChirp(cleanedWords.join(' '), validatedUserId);

  if (!result) {
    throw new Error(`Error occurred creating new chirp`);
  } else {
    res.status(201).send(result);
  }
};

export const handleGetAllChirps = async (req: Request, res: Response) => {
  const result = await getAllChirps();

  if (!result) {
    throw new Error(`Error occurred getting ALL chirps`);
  } else {
    res.status(200).send(result);
  }
};

export const handleGetChirp = async (req: Request, res: Response) => {
  const { chirpID } = req.params;

  const result = await getChirp(chirpID);
  if (!result) {
    throw new NotFoundError(`Error occurred getting chirp by Id`);
  }
  res.status(200).send(result);
};

export const handleUpdateUserCredentials = async (
  req: Request,
  res: Response
) => {
  // check for bearer token, must be jwt
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.jwtSecret);

  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error(`Email or password is missing`);
  }

  const hashedPassword = await hashPassword(password);

  const result = await updateUserCredentials(userId, email, hashedPassword);
  if (!result) {
    throw new Error(`Error occurred updating user`);
  }
  const newUserResponse: UserResponse = {
    id: result.id,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    email: result.email,
  };

  res.status(200).send(newUserResponse);

  //respond with  (newly updated User resource (omitting the password, of course).
};

export const handleDeleteChirp = async (req: Request, res: Response) => {
  const { chirpID } = req.params;

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.jwtSecret);

  const chirp = await getChirp(chirpID);

  if (!chirp) {
    throw new NotFoundError('Chirp not found');
  }

  if (chirp.userId !== userId) {
    res.status(403).send({ error: `Forbidden` });
    return;
  }

  const result = await deleteChirp(chirpID);

  if (!result) {
    throw new Error(`Error deleting chirp`);
  }

  res.status(204).send(`Chirp successfully deleted`);
};

export const webhookUpdateUserChirpRedStatus = async (
  req: Request,
  res: Response
) => {
  const { event, data } = req.body;

  if (!event || !data) {
    res.sendStatus(404); // respond to polka so they can retry
  }

  if (event === 'user.upgraded') {
    //updaete
    //check user exists
    const user = await getUserById(data.userId);
    if (!user) {
      throw new NotFoundError(`userId not found`);
    }

    const result = updateUserChirpRedStatus(data.userId);
    if (!result) {
      throw new Error('Error occurred updating user chirp red status');
    }
    res.sendStatus(204);
  } else {
    res.sendStatus(204);
  }
};
