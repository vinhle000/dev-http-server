import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export const middlewareLogResponses: Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode > 299) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`
      );
    }
  });

  next();
};

export const middlewareMetricInc: Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  config.fileserverHits++;

  next();
};

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class MessageTooLongError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('[DEBUG] errorHandler()  caught errdr ---> ', err); //use console.error instead??
  if (err instanceof NotFoundError) {
    res.status(404).send('Not Found');
  } else if (err instanceof MessageTooLongError) {
    res.status(400).send({ error: 'Chirp is too long. Max length is 140' });
  } else {
    res.status(500).json({
      error: 'Something went wrong on our end',
    });
  }
};
