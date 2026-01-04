import { vi } from "vitest";
import type { TestUser, TestOrganization, TestMembership, TestLeaderboard, TestRating, TestInvite } from "../factories";

// Mock database state
export interface MockDbState {
  users: TestUser[];
  organizations: TestOrganization[];
  memberships: TestMembership[];
  leaderboards: TestLeaderboard[];
  ratings: TestRating[];
  invites: TestInvite[];
}

// Create mock database query functions
export function createMockDb(state: MockDbState) {
  return {
    query: {
      users: {
        findFirst: vi.fn(({ where }: any) => {
          // Simple mock - in real tests would parse the where clause
          return state.users[0] || null;
        }),
        findMany: vi.fn(() => state.users),
      },
      organizations: {
        findFirst: vi.fn(({ where }: any) => state.organizations[0] || null),
        findMany: vi.fn(() => state.organizations),
      },
      organizationMemberships: {
        findFirst: vi.fn(({ where }: any) => state.memberships[0] || null),
        findMany: vi.fn(() => state.memberships),
      },
      leaderboards: {
        findFirst: vi.fn(({ where }: any) => state.leaderboards[0] || null),
        findMany: vi.fn(() => state.leaderboards),
      },
      leaderboardRatings: {
        findFirst: vi.fn(({ where }: any) => state.ratings[0] || null),
        findMany: vi.fn(() => state.ratings),
      },
      organizationInvites: {
        findFirst: vi.fn(({ where }: any) => state.invites[0] || null),
        findMany: vi.fn(() => state.invites),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "new-id" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
  };
}

// Create mock context for tRPC procedures
export function createMockContext(user: TestUser | null, dbState: MockDbState) {
  return {
    user: user
      ? {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }
      : null,
    db: createMockDb(dbState),
  };
}

// Rating calculation helpers for testing
export function calculateExpectedScore(rating1: number, rating2: number): number {
  return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
}

export function calculateRatingChange(
  winnerRating: number,
  loserRating: number,
  isDraw: boolean = false,
  kFactor: number = 32
): { winnerDelta: number; loserDelta: number } {
  const expectedWinner = calculateExpectedScore(winnerRating, loserRating);
  const expectedLoser = 1 - expectedWinner;

  const actualWinner = isDraw ? 0.5 : 1;
  const actualLoser = isDraw ? 0.5 : 0;

  const winnerDelta = Math.round(kFactor * (actualWinner - expectedWinner));
  const loserDelta = Math.round(kFactor * (actualLoser - expectedLoser));

  return { winnerDelta, loserDelta };
}
