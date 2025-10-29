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
} from '../lib/db/queries/users.js';
import {
  createChirp,
  getAllChirps,
  getChirp,
} from '../lib/db/queries/chirps.js';
import {
  getRefreshToken,
  getUserFromRefreshToken,
  revokeRefreshToken,
} from '../lib/db/queries/refreshTokens.js';
import { config } from '../config.js';

import { NewUser, RefreshToken } from '../lib/db/schema.js';
type UserResponse = Omit<NewUser, 'hashPassword'>;

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

/*
1. [ ] Add a PUT /api/users endpoint so that users can update their own (but not others') email and password.
  It requires: An access token in the header
 A new password and email in the request body


 2. [ ] Hash the password, then update the hashed password and the email for the authenticated user in the database.
  Respond with a 200 if everything is successful and the newly updated User resource (omitting the password, of course).

3. [ ] if the access token is malformed or missing, respond with a 401 status code.
*/

export const handleUpdateUser = async (req: Request, res: Response) => {
  // check for bearer token, must be jwt
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.jwtSecret);

  // get userId from jwt token

  // get password from req,
  // hash password

  // create db query funciton to update user record with hashed password

  //respond with  (newly updated User resource (omitting the password, of course).
};
