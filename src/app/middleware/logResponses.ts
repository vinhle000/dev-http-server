import { type Request, Response, NextFunction } from 'express';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

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
