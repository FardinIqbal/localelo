import { faker } from "@faker-js/faker";

// Type definitions matching schema
export interface TestUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  website: string | null;
  imageUrl: string | null;
  visibility: "public" | "private";
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestMembership {
  id: string;
  organizationId: string;
  userId: string;
  username: string;
  status: "pending" | "approved" | "banned";
  isAdmin: boolean;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestLeaderboard {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  sport: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestRating {
  id: string;
  leaderboardId: string;
  membershipId: string;
  rating: number;
  ratingDeviation: number;
  volatility: number;
  wins: number;
  losses: number;
  draws: number;
  lastRatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestMatch {
  id: string;
  leaderboardId: string;
  winnerMembershipId: string | null;
  isDraw: boolean;
  status: "active" | "invalidated";
  matchTime: Date;
  ratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestInvite {
  id: string;
  organizationId: string;
  code: string;
  createdById: string;
  maxUses: number | null;
  uses: number;
  expiresAt: Date | null;
  createdAt: Date;
}

// Factory functions
export function createUser(overrides: Partial<TestUser> = {}): TestUser {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    clerkId: `user_${faker.string.alphanumeric(24)}`,
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    imageUrl: faker.image.avatar(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createOrganization(overrides: Partial<TestOrganization> = {}): TestOrganization {
  const name = overrides.name || faker.company.name();
  const now = new Date();
  return {
    id: faker.string.uuid(),
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
    description: faker.company.catchPhrase(),
    location: faker.location.city(),
    website: faker.internet.url(),
    imageUrl: null,
    visibility: "public",
    createdById: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMembership(overrides: Partial<TestMembership> = {}): TestMembership {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    userId: faker.string.uuid(),
    username: faker.internet.username(),
    status: "approved",
    isAdmin: false,
    isOwner: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createLeaderboard(overrides: Partial<TestLeaderboard> = {}): TestLeaderboard {
  const now = new Date();
  const sports = ["BJJ", "Chess", "Pool", "Ping Pong", "Tennis", "Basketball"];
  return {
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    name: faker.helpers.arrayElement(sports) + " " + faker.word.adjective(),
    description: faker.lorem.sentence(),
    sport: faker.helpers.arrayElement(sports),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createRating(overrides: Partial<TestRating> = {}): TestRating {
  const now = new Date();
  const wins = faker.number.int({ min: 0, max: 50 });
  const losses = faker.number.int({ min: 0, max: 50 });
  return {
    id: faker.string.uuid(),
    leaderboardId: faker.string.uuid(),
    membershipId: faker.string.uuid(),
    rating: faker.number.float({ min: 1200, max: 2000, fractionDigits: 2 }),
    ratingDeviation: faker.number.float({ min: 50, max: 350, fractionDigits: 2 }),
    volatility: 0.06,
    wins,
    losses,
    draws: faker.number.int({ min: 0, max: 10 }),
    lastRatedAt: wins + losses > 0 ? now : null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMatch(overrides: Partial<TestMatch> = {}): TestMatch {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    leaderboardId: faker.string.uuid(),
    winnerMembershipId: faker.string.uuid(),
    isDraw: false,
    status: "active",
    matchTime: now,
    ratedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createInvite(overrides: Partial<TestInvite> = {}): TestInvite {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    id: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    code: faker.string.alphanumeric(8),
    createdById: faker.string.uuid(),
    maxUses: null,
    uses: 0,
    expiresAt,
    createdAt: now,
    ...overrides,
  };
}

// Seed data generator - creates a complete test environment
export function createTestEnvironment() {
  // Create users
  const users = Array.from({ length: 10 }, () => createUser());

  // Create organizations
  const organizations = [
    createOrganization({ name: "BJJ Academy", createdById: users[0].id }),
    createOrganization({ name: "Chess Club", createdById: users[1].id }),
    createOrganization({ name: "Pool Hall", createdById: users[2].id, visibility: "private" }),
  ];

  // Create memberships
  const memberships: TestMembership[] = [];
  organizations.forEach((org, orgIndex) => {
    // Add owner
    memberships.push(
      createMembership({
        organizationId: org.id,
        userId: users[orgIndex].id,
        username: users[orgIndex].firstName || "Owner",
        isOwner: true,
        isAdmin: true,
      })
    );

    // Add 3-5 members per org
    const memberCount = faker.number.int({ min: 3, max: 5 });
    for (let i = 0; i < memberCount; i++) {
      const userIndex = (orgIndex * 3 + i + 3) % users.length;
      memberships.push(
        createMembership({
          organizationId: org.id,
          userId: users[userIndex].id,
          username: users[userIndex].firstName || `Member${i}`,
        })
      );
    }
  });

  // Create leaderboards
  const leaderboards: TestLeaderboard[] = [];
  organizations.forEach((org) => {
    leaderboards.push(
      createLeaderboard({ organizationId: org.id, name: "Main Ladder" }),
      createLeaderboard({ organizationId: org.id, name: "Beginners" })
    );
  });

  // Create ratings
  const ratings: TestRating[] = [];
  leaderboards.forEach((lb) => {
    const orgMemberships = memberships.filter((m) => m.organizationId === lb.organizationId);
    orgMemberships.forEach((m) => {
      ratings.push(
        createRating({
          leaderboardId: lb.id,
          membershipId: m.id,
        })
      );
    });
  });

  // Create matches
  const matches: TestMatch[] = [];
  leaderboards.forEach((lb) => {
    const lbRatings = ratings.filter((r) => r.leaderboardId === lb.id);
    // Create 5 matches per leaderboard
    for (let i = 0; i < 5; i++) {
      const winner = faker.helpers.arrayElement(lbRatings);
      const loser = faker.helpers.arrayElement(lbRatings.filter((r) => r.id !== winner.id));

      matches.push(
        createMatch({
          leaderboardId: lb.id,
          winnerMembershipId: winner.membershipId,
        })
      );
    }
  });

  // Create invites
  const invites: TestInvite[] = [];
  organizations.forEach((org) => {
    const owner = memberships.find((m) => m.organizationId === org.id && m.isOwner);
    if (owner) {
      invites.push(
        createInvite({
          organizationId: org.id,
          createdById: owner.userId,
        })
      );
    }
  });

  return {
    users,
    organizations,
    memberships,
    leaderboards,
    ratings,
    matches,
    invites,
  };
}

// Specific test scenarios
export const testScenarios = {
  // User with no orgs
  newUser: () => createUser(),

  // User who owns an org
  orgOwner: () => {
    const user = createUser();
    const org = createOrganization({ createdById: user.id });
    const membership = createMembership({
      organizationId: org.id,
      userId: user.id,
      isOwner: true,
      isAdmin: true,
    });
    return { user, org, membership };
  },

  // User who is just a member
  orgMember: () => {
    const owner = createUser();
    const member = createUser();
    const org = createOrganization({ createdById: owner.id });
    const ownerMembership = createMembership({
      organizationId: org.id,
      userId: owner.id,
      isOwner: true,
      isAdmin: true,
    });
    const memberMembership = createMembership({
      organizationId: org.id,
      userId: member.id,
    });
    return { owner, member, org, ownerMembership, memberMembership };
  },

  // Expired invite
  expiredInvite: () => {
    const user = createUser();
    const org = createOrganization({ createdById: user.id });
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    const invite = createInvite({
      organizationId: org.id,
      createdById: user.id,
      expiresAt: expiredDate,
    });
    return { user, org, invite };
  },

  // Max uses reached invite
  maxUsesInvite: () => {
    const user = createUser();
    const org = createOrganization({ createdById: user.id });
    const invite = createInvite({
      organizationId: org.id,
      createdById: user.id,
      maxUses: 5,
      uses: 5,
    });
    return { user, org, invite };
  },

  // Match between two players
  matchScenario: () => {
    const { user: owner, org, membership: ownerMembership } = testScenarios.orgOwner();
    const opponent = createUser();
    const opponentMembership = createMembership({
      organizationId: org.id,
      userId: opponent.id,
    });
    const leaderboard = createLeaderboard({ organizationId: org.id });
    const ownerRating = createRating({
      leaderboardId: leaderboard.id,
      membershipId: ownerMembership.id,
      rating: 1500,
    });
    const opponentRating = createRating({
      leaderboardId: leaderboard.id,
      membershipId: opponentMembership.id,
      rating: 1500,
    });

    return {
      owner,
      opponent,
      org,
      ownerMembership,
      opponentMembership,
      leaderboard,
      ownerRating,
      opponentRating,
    };
  },
};
