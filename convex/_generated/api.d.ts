/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as invites from "../invites.js";
import type * as leaderboards from "../leaderboards.js";
import type * as lib_glicko2 from "../lib/glicko2.js";
import type * as matches from "../matches.js";
import type * as memberships from "../memberships.js";
import type * as organizations from "../organizations.js";
import type * as ratings from "../ratings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  invites: typeof invites;
  leaderboards: typeof leaderboards;
  "lib/glicko2": typeof lib_glicko2;
  matches: typeof matches;
  memberships: typeof memberships;
  organizations: typeof organizations;
  ratings: typeof ratings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
