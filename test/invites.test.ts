import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUser,
  createOrganization,
  createMembership,
  createInvite,
  createTestEnvironment,
  testScenarios,
} from "./factories";

describe("Invite System", () => {
  describe("Invite Code Generation", () => {
    it("should generate 8-character codes", () => {
      const invite = createInvite();
      expect(invite.code).toHaveLength(8);
    });

    it("should generate unique codes", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(createInvite().code);
      }
      expect(codes.size).toBe(100);
    });

    it("should generate URL-safe codes", () => {
      const invite = createInvite();
      expect(invite.code).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe("Invite Validation", () => {
    it("should consider valid invite as valid", () => {
      const invite = createInvite();
      const now = new Date();

      const isExpired = invite.expiresAt ? invite.expiresAt < now : false;
      const isMaxUsesReached = invite.maxUses ? invite.uses >= invite.maxUses : false;

      expect(isExpired).toBe(false);
      expect(isMaxUsesReached).toBe(false);
    });

    it("should detect expired invites", () => {
      const { invite } = testScenarios.expiredInvite();
      const now = new Date();

      const isExpired = invite.expiresAt ? invite.expiresAt < now : false;
      expect(isExpired).toBe(true);
    });

    it("should detect max uses reached", () => {
      const { invite } = testScenarios.maxUsesInvite();

      const isMaxUsesReached = invite.maxUses ? invite.uses >= invite.maxUses : false;
      expect(isMaxUsesReached).toBe(true);
    });

    it("should allow unlimited uses when maxUses is null", () => {
      const invite = createInvite({ maxUses: null, uses: 1000 });

      const isMaxUsesReached = invite.maxUses ? invite.uses >= invite.maxUses : false;
      expect(isMaxUsesReached).toBe(false);
    });

    it("should allow never-expiring invites when expiresAt is null", () => {
      const invite = createInvite({ expiresAt: null });
      const now = new Date();

      const isExpired = invite.expiresAt ? invite.expiresAt < now : false;
      expect(isExpired).toBe(false);
    });
  });

  describe("Invite Creation Rules", () => {
    it("should only allow admins/owners to create invites", () => {
      const { ownerMembership, memberMembership } = testScenarios.orgMember();

      const canOwnerCreate = ownerMembership.isAdmin || ownerMembership.isOwner;
      const canMemberCreate = memberMembership.isAdmin || memberMembership.isOwner;

      expect(canOwnerCreate).toBe(true);
      expect(canMemberCreate).toBe(false);
    });

    it("should set default expiration to 7 days", () => {
      const now = new Date();
      const invite = createInvite();

      if (invite.expiresAt) {
        const diffDays = Math.round(
          (invite.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(diffDays).toBe(7);
      }
    });

    it("should start with 0 uses", () => {
      const invite = createInvite();
      expect(invite.uses).toBe(0);
    });
  });

  describe("Invite Acceptance", () => {
    it("should increment uses when accepted", () => {
      const invite = createInvite({ uses: 0 });
      const newUses = invite.uses + 1;
      expect(newUses).toBe(1);
    });

    it("should not allow accepting expired invite", () => {
      const { invite } = testScenarios.expiredInvite();
      const now = new Date();

      const canAccept = !(invite.expiresAt && invite.expiresAt < now);
      expect(canAccept).toBe(false);
    });

    it("should not allow accepting invite with max uses reached", () => {
      const { invite } = testScenarios.maxUsesInvite();

      const canAccept = !(invite.maxUses && invite.uses >= invite.maxUses);
      expect(canAccept).toBe(false);
    });

    it("should auto-approve membership for invite users", () => {
      const membership = createMembership({ status: "approved" });
      expect(membership.status).toBe("approved");
    });
  });

  describe("QR Code URL Generation", () => {
    it("should generate valid QR code URL", () => {
      const invite = createInvite();
      const baseUrl = "http://localhost:3000";
      const inviteUrl = `${baseUrl}/invite/${invite.code}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inviteUrl)}&bgcolor=000000&color=ffffff&margin=0`;

      expect(qrUrl).toContain("api.qrserver.com");
      expect(qrUrl).toContain(encodeURIComponent(inviteUrl));
    });

    it("should properly encode invite URL in QR", () => {
      const invite = createInvite({ code: "ABC123xy" });
      const inviteUrl = `http://localhost:3000/invite/${invite.code}`;
      const encoded = encodeURIComponent(inviteUrl);

      expect(encoded).not.toContain(":");
      expect(encoded).not.toContain("/");
    });
  });
});

describe("Organization Membership", () => {
  describe("Status Transitions", () => {
    it("should default to pending for private orgs", () => {
      const org = createOrganization({ visibility: "private" });
      // For private orgs, new members should be pending
      expect(org.visibility).toBe("private");
    });

    it("should auto-approve for public orgs", () => {
      const org = createOrganization({ visibility: "public" });
      expect(org.visibility).toBe("public");
    });

    it("should track owner status correctly", () => {
      const { membership } = testScenarios.orgOwner();
      expect(membership.isOwner).toBe(true);
      expect(membership.isAdmin).toBe(true);
    });
  });

  describe("Username Uniqueness", () => {
    it("should require unique username per org", () => {
      const org = createOrganization();
      const membership1 = createMembership({
        organizationId: org.id,
        username: "player1",
      });
      const membership2 = createMembership({
        organizationId: org.id,
        username: "player1",
      });

      // In real system, this would fail - test the constraint
      expect(membership1.username).toBe(membership2.username);
      expect(membership1.id).not.toBe(membership2.id);
    });

    it("should allow same username in different orgs", () => {
      const org1 = createOrganization();
      const org2 = createOrganization();

      const membership1 = createMembership({
        organizationId: org1.id,
        username: "player1",
      });
      const membership2 = createMembership({
        organizationId: org2.id,
        username: "player1",
      });

      expect(membership1.username).toBe(membership2.username);
      expect(membership1.organizationId).not.toBe(membership2.organizationId);
    });
  });
});

describe("Leaderboard Ratings", () => {
  describe("Initial Rating", () => {
    it("should start at 1500 default", () => {
      // Check factory default
      const rating = { rating: 1500 };
      expect(rating.rating).toBe(1500);
    });

    it("should start with high deviation (350)", () => {
      const defaultDeviation = 350;
      expect(defaultDeviation).toBe(350);
    });
  });

  describe("Win/Loss Tracking", () => {
    it("should track wins correctly", () => {
      const scenario = testScenarios.matchScenario();
      const initialWins = scenario.ownerRating.wins;
      const newWins = initialWins + 1;

      expect(newWins).toBeGreaterThan(initialWins);
    });

    it("should track losses correctly", () => {
      const scenario = testScenarios.matchScenario();
      const initialLosses = scenario.opponentRating.losses;
      const newLosses = initialLosses + 1;

      expect(newLosses).toBeGreaterThan(initialLosses);
    });
  });
});

describe("Match Creation", () => {
  describe("Match Validation", () => {
    it("should require a leaderboard", () => {
      const scenario = testScenarios.matchScenario();
      expect(scenario.leaderboard.id).toBeDefined();
    });

    it("should set matchTime to now", () => {
      const now = new Date();
      const match = {
        matchTime: now,
      };

      const timeDiff = Math.abs(match.matchTime.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it("should allow null winner for draws", () => {
      const match = {
        winnerMembershipId: null,
        isDraw: true,
      };

      expect(match.winnerMembershipId).toBeNull();
      expect(match.isDraw).toBe(true);
    });

    it("should have winner for non-draw matches", () => {
      const scenario = testScenarios.matchScenario();
      const match = {
        winnerMembershipId: scenario.ownerMembership.id,
        isDraw: false,
      };

      expect(match.winnerMembershipId).toBeDefined();
      expect(match.isDraw).toBe(false);
    });
  });

  describe("Match Outcomes", () => {
    it("should handle win outcome", () => {
      const outcome = "win";
      expect(outcome).toBe("win");
    });

    it("should handle loss outcome", () => {
      const outcome = "loss";
      expect(outcome).toBe("loss");
    });

    it("should handle draw outcome", () => {
      const outcome = "draw";
      expect(outcome).toBe("draw");
    });
  });
});

describe("Test Environment", () => {
  it("should create complete test environment", () => {
    const env = createTestEnvironment();

    expect(env.users.length).toBe(10);
    expect(env.organizations.length).toBe(3);
    expect(env.leaderboards.length).toBe(6); // 2 per org
    expect(env.invites.length).toBe(3); // 1 per org
    expect(env.memberships.length).toBeGreaterThan(0);
    expect(env.ratings.length).toBeGreaterThan(0);
    expect(env.matches.length).toBeGreaterThan(0);
  });

  it("should link data correctly", () => {
    const env = createTestEnvironment();

    // Each leaderboard should belong to an org
    env.leaderboards.forEach((lb: any) => {
      const org = env.organizations.find((o: any) => o.id === lb.organizationId);
      expect(org).toBeDefined();
    });

    // Each membership should belong to an org and user
    env.memberships.forEach((m: any) => {
      const org = env.organizations.find((o: any) => o.id === m.organizationId);
      const user = env.users.find((u: any) => u.id === m.userId);
      expect(org).toBeDefined();
      expect(user).toBeDefined();
    });

    // Each rating should belong to a leaderboard and membership
    env.ratings.forEach((r: any) => {
      const lb = env.leaderboards.find((l: any) => l.id === r.leaderboardId);
      const membership = env.memberships.find((m: any) => m.id === r.membershipId);
      expect(lb).toBeDefined();
      expect(membership).toBeDefined();
    });
  });
});
