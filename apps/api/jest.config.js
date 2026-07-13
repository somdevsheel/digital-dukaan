// Plain CJS, not jest.config.ts — a TS config file needs ts-node just to be *read*, an
// extra dependency for zero benefit here since this file has no real logic to type-check.
/** @type {import('jest').Config} */
module.exports = {
  // Two projects, deliberately separate: `unit` runs on every commit/CI push with zero
  // external dependencies (fake in-memory repositories, no DB/Redis) and stays fast;
  // `integration` needs the real docker-compose infra up (`pnpm infra:up` from the repo
  // root) and proves the things a mock can't — Postgres's actual row-locking behavior
  // under concurrent writes, which is the entire point of tests like stock-decrement.spec.
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      rootDir: ".",
      testMatch: ["<rootDir>/src/**/*.spec.ts"],
      setupFiles: ["<rootDir>/test/jest.setup.ts"],
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      rootDir: ".",
      testMatch: ["<rootDir>/test/**/*.integration-spec.ts"],
      setupFiles: ["<rootDir>/test/jest.setup.ts"],
      // testTimeout isn't a supported per-project key in Jest's multi-project config —
      // set via --testTimeout on the test:integration script instead (package.json).
    },
  ],
};
