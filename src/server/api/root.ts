import { router } from "./trpc";
import { organizationsRouter } from "./routers/organizations";
import { leaderboardsRouter } from "./routers/leaderboards";
import { matchesRouter } from "./routers/matches";
import { activityRouter } from "./routers/activity";
import { streaksRouter } from "./routers/streaks";
import { leaguesRouter } from "./routers/leagues";
import { challengesRouter } from "./routers/challenges";

export const appRouter = router({
  organizations: organizationsRouter,
  leaderboards: leaderboardsRouter,
  matches: matchesRouter,
  activity: activityRouter,
  streaks: streaksRouter,
  leagues: leaguesRouter,
  challenges: challengesRouter,
});

export type AppRouter = typeof appRouter;
