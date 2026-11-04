/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }] },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  clearMocks: true,
  testTimeout: 15000,
  collectCoverageFrom: [
    "src/schemas/**/*.ts",
    "src/utils/password.ts",
    "src/utils/jwt.ts",
  ],
  coverageDirectory: "coverage",
  // Estos umbrales aplican a los módulos indicados en collectCoverageFrom.
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};
