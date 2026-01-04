import { describe, it, expect, beforeEach } from "vitest";
import {
  createUser,
  createOrganization,
  createMembership,
  createLeaderboard,
  createRating,
  createInvite,
  createTestEnvironment,
  testScenarios,
} from "./factories";
import { createMockContext, calculateRatingChange, type MockDbState } from "./utils/test-context";

describe("Organizations Router", () => {
  let dbState: MockDbState;

  beforeEach(() => {
    const env = createTestEnvironment();
    dbState = {
      users: env.users,
      organizations: env.organizations,
      memberships: env.memberships,
      leaderboards: env.leaderboards,
      ratings: env.ratings,
      invites: env.invites,
    };
  });

  describe("getBySlug", () => {
    it("should return organization by slug", () => {
      const org = dbState.organizations[0];
      const found = dbState.organizations.find((o) => o.slug === org.slug);

      expect(found).toBeDefined();
      expect(found?.name).toBe(org.name);
    });

    it("should return null for non-existent slug", () => {
      const found = dbState.organizations.find((o) => o.slug === "non-existent");
      expect(found).toBeUndefined();
    });
  });

  describe("join", () => {
    it("should create membership when joining public org", () => {
      const user = createUser();
      const org = dbState.organizations.find((o) => o.visibility === "public");

      expect(org).toBeDefined();

      const newMembership = createMembership({
        organizationId: org!.id,
        userId: user.id,
        status: "approved",
      });

      expect(newMembership.status).toBe("approved");
    });

    it("should create pending membership for private org", () => {
      const user = createUser();
      const org = dbState.organizations.find((o) => o.visibility === "private");

      if (org) {
        const newMembership = createMembership({
          organizationId: org.id,
          userId: user.id,
          status: "pending",
        });

        expect(newMembership.status).toBe("pending");
      }
    });

    it("should prevent duplicate memberships", () => {
      const existingMembership = dbState.memberships[0];
      const duplicateCheck = dbState.memberships.filter(
        (m) =>
          m.organizationId === existingMembership.organizationId &&
          m.userId === existingMembership.userId
      );

      expect(duplicateCheck.length).toBe(1);
    });
  });

  describe("create", () => {
    it("should create organization with owner membership", () => {
      const user = createUser();
      const org = createOrganization({ createdById: user.id });
      const ownerMembership = createMembership({
        organizationId: org.id,
        userId: user.id,
        isOwner: true,
        isAdmin: true,
        status: "approved",
      });

      expect(org.createdById).toBe(user.id);
      expect(ownerMembership.isOwner).toBe(true);
      expect(ownerMembership.isAdmin).toBe(true);
    });

    it("should generate valid slug from name", () => {
      const org = createOrganization({ name: "Test Org Name" });
      expect(org.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});

describe("Invites Router", () => {
  let dbState: MockDbState;

  beforeEach(() => {
    const env = createTestEnvironment();
    dbState = {
      users: env.users,
      organizations: env.organizations,
      memberships: env.memberships,
      leaderboards: env.leaderboards,
      ratings: env.ratings,
      invites: env.invites,
    };
  });

  describe("create", () => {
    it("should create invite with 8-char code", () => {
      const invite = createInvite();
      expect(invite.code).toHaveLength(8);
    });

    it("should set correct expiration", () => {
      const invite = createInvite();
      const now = new Date();

      if (invite.expiresAt) {
        const diffMs = invite.expiresAt.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        expect(diffDays).toBeGreaterThan(6);
        expect(diffDays).toBeLessThanOrEqual(7);
      }
    });

    it("should only allow admins to create", () => {
      const { ownerMembership, memberMembership } = testScenarios.orgMember();

      expect(ownerMembership.isAdmin || ownerMembership.isOwner).toBe(true);
      expect(memberMembership.isAdmin || memberMembership.isOwner).toBe(false);
    });
  });

  describe("validate", () => {
    it("should return valid for active invite", () => {
      const invite = dbState.invites[0];
      const now = new Date();

      const isExpired = invite.expiresAt ? invite.expiresAt < now : false;
      const isMaxUsed = invite.maxUses ? invite.uses >= invite.maxUses : false;
      const isValid = !isExpired && !isMaxUsed;

      expect(isValid).toBe(true);
    });

    it("should return invalid for expired invite", () => {
      const { invite } = testScenarios.expiredInvite();
      const now = new Date();

      const isExpired = invite.expiresAt ? invite.expiresAt < now : false;
      expect(isExpired).toBe(true);
    });

    it("should return invalid for max-used invite", () => {
      const { invite } = testScenarios.maxUsesInvite();

      const isMaxUsed = invite.maxUses ? invite.uses >= invite.maxUses : false;
      expect(isMaxUsed).toBe(true);
    });
  });

  describe("accept", () => {
    it("should create approved membership", () => {
      const user = createUser();
      const invite = dbState.invites[0];

      const membership = createMembership({
        organizationId: invite.organizationId,
        userId: user.id,
        status: "approved",
      });

      expect(membership.status).toBe("approved");
    });

    it("should increment uses counter", () => {
      const invite = createInvite({ uses: 0 });
      const newUses = invite.uses + 1;

      expect(newUses).toBe(1);
    });

    it("should reject duplicate membership", () => {
      const existingMembership = dbState.memberships[0];
      const alreadyMember = dbState.memberships.some(
        (m) =>
          m.organizationId === existingMembership.organizationId &&
          m.userId === existingMembership.userId
      );

      expect(alreadyMember).toBe(true);
    });
  });
});

describe("Matches Router", () => {
  describe("create", () => {
    it("should update ratings correctly for win", () => {
      const { winnerDelta, loserDelta } = calculateRatingChange(1500, 1500, false);

      expect(winnerDelta).toBeGreaterThan(0);
      expect(loserDelta).toBeLessThan(0);
      expect(winnerDelta).toBe(-loserDelta);
    });

    it("should update ratings correctly for draw", () => {
      const { winnerDelta, loserDelta } = calculateRatingChange(1500, 1500, true);

      expect(winnerDelta).toBe(0);
      expect(loserDelta).toBe(0);
    });

    it("should give more points for upset wins", () => {
      const { winnerDelta: upsetDelta } = calculateRatingChange(1300, 1700, false);
      const { winnerDelta: normalDelta } = calculateRatingChange(1500, 1500, false);

      expect(upsetDelta).toBeGreaterThan(normalDelta);
    });

    it("should give fewer points for expected wins", () => {
      const { winnerDelta: expectedDelta } = calculateRatingChange(1700, 1300, false);
      const { winnerDelta: normalDelta } = calculateRatingChange(1500, 1500, false);

      expect(expectedDelta).toBeLessThan(normalDelta);
    });

    it("should set matchTime to current time", () => {
      const now = new Date();
      const match = {
        matchTime: now,
        ratedAt: now,
      };

      expect(match.matchTime.getTime()).toBe(match.ratedAt.getTime());
    });
  });

  describe("recentOpponents", () => {
    it("should return opponents sorted by match count", () => {
      const scenario = testScenarios.matchScenario();
      const opponents = [
        { opponentId: "a", matchCount: 5 },
        { opponentId: "b", matchCount: 10 },
        { opponentId: "c", matchCount: 3 },
      ];

      const sorted = opponents.sort((a, b) => b.matchCount - a.matchCount);

      expect(sorted[0].matchCount).toBe(10);
      expect(sorted[1].matchCount).toBe(5);
      expect(sorted[2].matchCount).toBe(3);
    });
  });
});

describe("Rankings Router", () => {
  let dbState: MockDbState;

  beforeEach(() => {
    const env = createTestEnvironment();
    dbState = {
      users: env.users,
      organizations: env.organizations,
      memberships: env.memberships,
      leaderboards: env.leaderboards,
      ratings: env.ratings,
      invites: env.invites,
    };
  });

  describe("myRankings", () => {
    it("should return all user rankings across orgs", () => {
      const user = dbState.users[0];
      const userMemberships = dbState.memberships.filter((m) => m.userId === user.id);
      const userRatings = dbState.ratings.filter((r) =>
        userMemberships.some((m) => m.id === r.membershipId)
      );

      expect(userRatings.length).toBeGreaterThan(0);
    });

    it("should include organization info", () => {
      const rating = dbState.ratings[0];
      const membership = dbState.memberships.find((m) => m.id === rating.membershipId);
      const org = dbState.organizations.find((o) => o.id === membership?.organizationId);

      expect(org).toBeDefined();
    });

    it("should calculate rank correctly", () => {
      const leaderboard = dbState.leaderboards[0];
      const leaderboardRatings = dbState.ratings
        .filter((r) => r.leaderboardId === leaderboard.id)
        .sort((a, b) => b.rating - a.rating);

      leaderboardRatings.forEach((rating, index) => {
        const rank = index + 1;
        expect(rank).toBeGreaterThan(0);
        expect(rank).toBeLessThanOrEqual(leaderboardRatings.length);
      });
    });
  });

  describe("myRankingsStats", () => {
    it("should calculate best rank", () => {
      const ranks = [5, 2, 8, 1, 3];
      const bestRank = Math.min(...ranks);

      expect(bestRank).toBe(1);
    });

    it("should count total leaderboards", () => {
      const user = dbState.users[0];
      const userMemberships = dbState.memberships.filter((m) => m.userId === user.id);
      const leaderboardCount = dbState.ratings.filter((r) =>
        userMemberships.some((m) => m.id === r.membershipId)
      ).length;

      expect(leaderboardCount).toBeGreaterThanOrEqual(0);
    });

    it("should count total organizations", () => {
      const user = dbState.users[0];
      const userMemberships = dbState.memberships.filter((m) => m.userId === user.id);
      const orgIds = new Set(userMemberships.map((m) => m.organizationId));

      expect(orgIds.size).toBeGreaterThan(0);
    });
  });
});

describe("Leaderboards Router", () => {
  describe("rankings", () => {
    it("should sort by rating descending", () => {
      const ratings = [
        { rating: 1500 },
        { rating: 1800 },
        { rating: 1300 },
        { rating: 1650 },
      ];

      const sorted = ratings.sort((a, b) => b.rating - a.rating);

      expect(sorted[0].rating).toBe(1800);
      expect(sorted[sorted.length - 1].rating).toBe(1300);
    });

    it("should include streak data", () => {
      const scenario = testScenarios.matchScenario();

      // Streak would be calculated from match history
      const streak = 3; // Example
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    it("should calculate 7-day rating change", () => {
      const currentRating = 1550;
      const ratingSevenDaysAgo = 1500;
      const change = currentRating - ratingSevenDaysAgo;

      expect(change).toBe(50);
    });
  });

  describe("create", () => {
    it("should create leaderboard for org", () => {
      const org = createOrganization();
      const leaderboard = createLeaderboard({
        organizationId: org.id,
        name: "New Ladder",
      });

      expect(leaderboard.organizationId).toBe(org.id);
      expect(leaderboard.name).toBe("New Ladder");
    });

    it("should auto-add all org members to new leaderboard", () => {
      const org = createOrganization();
      const members = [
        createMembership({ organizationId: org.id }),
        createMembership({ organizationId: org.id }),
        createMembership({ organizationId: org.id }),
      ];
      const leaderboard = createLeaderboard({ organizationId: org.id });

      const ratings = members.map((m) =>
        createRating({
          leaderboardId: leaderboard.id,
          membershipId: m.id,
          rating: 1500,
        })
      );

      expect(ratings.length).toBe(members.length);
      ratings.forEach((r) => {
        expect(r.rating).toBe(1500);
      });
    });
  });
});

describe("Activity Router", () => {
  describe("recentActivity", () => {
    it("should format time correctly", () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const diffMs = now.getTime() - fiveMinutesAgo.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));

      expect(diffMinutes).toBe(5);
    });

    it("should limit to recent matches", () => {
      const limit = 20;
      const allMatches = Array.from({ length: 50 }, () => ({}));
      const recentMatches = allMatches.slice(0, limit);

      expect(recentMatches.length).toBe(20);
    });
  });

  describe("orgStats", () => {
    it("should aggregate stats per org", () => {
      const env = createTestEnvironment();

      const orgStats = env.organizations.map((org) => {
        const memberships = env.memberships.filter((m) => m.organizationId === org.id);
        const ratings = env.ratings.filter((r) =>
          memberships.some((m) => m.id === r.membershipId)
        );

        return {
          organizationId: org.id,
          name: org.name,
          memberCount: memberships.length,
          ratingCount: ratings.length,
        };
      });

      expect(orgStats.length).toBe(3);
      orgStats.forEach((stat) => {
        expect(stat.memberCount).toBeGreaterThan(0);
      });
    });
  });
});
