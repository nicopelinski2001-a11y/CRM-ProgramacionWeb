/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }] },
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/components/CustomerForm.tsx",
    "src/components/Modal.tsx",
    "src/api/errors.ts",
  ],
  coverageDirectory: "coverage",
  // Cobertura de los componentes críticos seleccionados; no de toda la UI.
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};
