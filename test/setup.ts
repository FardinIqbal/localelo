import { beforeAll, afterAll, afterEach, vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/localelo_test";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_mock";
process.env.CLERK_SECRET_KEY = "sk_test_mock";

// Global test setup
beforeAll(() => {
  // Any global setup
});

afterAll(() => {
  // Any global cleanup
});

afterEach(() => {
  // Clear mocks after each test
  vi.clearAllMocks();
});

// Mock window for tests that need it
if (typeof window === "undefined") {
  // @ts-ignore
  global.window = {
    location: {
      origin: "http://localhost:3000",
    },
  };
}

// Mock navigator.vibrate
if (typeof navigator === "undefined") {
  // @ts-ignore
  global.navigator = {
    vibrate: vi.fn(),
  };
}
