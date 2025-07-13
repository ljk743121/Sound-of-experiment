import { router } from '../trpc';
import { arrangementsRouter } from './arrangements';
import { searchRouter } from './search';
import { songRouter } from './song';
import { statsRouter } from './stats';
import { timeRouter } from './time';
import { userRouter } from './user';
import { blockWordsRouter } from './words';
import { configRouter } from './config';

export const appRouter = router({
  user: userRouter,
  song: songRouter,
  time: timeRouter,
  stats: statsRouter,
  arrangements: arrangementsRouter,
  blockWords: blockWordsRouter,
  search: searchRouter,
  config: configRouter,
});

export type AppRouter = typeof appRouter;
