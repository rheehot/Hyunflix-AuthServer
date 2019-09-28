import { Router, Request, Response, NextFunction } from 'express';

import { Session, User } from '@src/entity';
import { IUser } from '@src/models';
import * as jwt from '@src/utils/jwt';

const router: Router = Router();

export async function validateToken(req: Request): Promise<IUser | null> {
  let token = '';

  if (req.cookies['x-hyunsub-token']) {
    token = req.cookies['x-hyunsub-token'];
  }

  if (req.headers['authorization']) {
    token = req.headers['authorization'].toString().replace('Bearer ', '');
  }

  if (!token) {
    return null;
  }

  const session: Session | null = await Session.findByToken(token);

  if (!session) {
    return null;
  }

  try {
    const decoded = jwt.verify(token);
    const userId: number = decoded.userId;

    const user: User | null = await User.findById(userId);

    if (!user) {
      return null;
    }

    return user.convert(token);
  } catch (err) {
    return null;
  }
}

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  (async function () {
    const user: IUser | null = await validateToken(req);

    if (user) {
      res.status(204);
      res.set({
        'x-hyunsub-userId': user.userId,
        'x-hyunsub-authorizations': user.allowedPaths, // TODO authorizations 을 다른 이름으로 바꾸기
        'x-hyunsub-authority': user.authority,
      });
      res.end();
    } else {
      res.status(401);
      res.end();
    }
  })().catch(err => next(err));
});

export default router;
