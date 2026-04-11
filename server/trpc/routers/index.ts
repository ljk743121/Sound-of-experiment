import { router } from "../trpc";
import { announcementRouter } from "./announcement";
import { arrangementsRouter } from "./arrangements";
import { configRouter } from "./config";
import { searchRouter } from "./search";
import { songRouter } from "./song";
import { statsRouter } from "./stats";
import { timeRouter } from "./time";
import { userRouter } from "./user";
import { blockWordsRouter } from "./words";

export const appRouter = router({
  user: userRouter,
  song: songRouter,
  time: timeRouter,
  stats: statsRouter,
  arrangements: arrangementsRouter,
  blockWords: blockWordsRouter,
  search: searchRouter,
  config: configRouter,
  announcement: announcementRouter,
});

export type AppRouter = typeof appRouter;
