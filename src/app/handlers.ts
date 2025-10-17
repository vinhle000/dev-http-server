import express, { Request, Response } from 'express';

import {
  NotFoundError,
  MessageTooLongError,
  type Middleware,
  UnauthorizedError,
} from './middleware.js';
import { hashPassword, checkPasswordHash } from '../lib/auth.js';
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

import { config } from '../config.js';

import { NewUser } from '../lib/db/schema.js';
type UserResponse = Omit<NewUser, 'hashPassword'>;

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
  if (!user || !(await checkPasswordHash(user.hashedPassword, password))) {
    throw new UnauthorizedError(`Incorrect email or password`);
  }
  const userResponse: UserResponse = {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
  };
  res.status(200).send(userResponse);
};
export const handleCreateChirp = async (req: Request, res: Response) => {
  const { body, userId } = req.body;

  // NOTE - maybe validate user exists in db

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
