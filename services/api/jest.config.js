module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/integration/"],
  coverageReporters: ["json-summary", "lcov", "clover", "text"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.config.js",
    "!src/docs/**",
    "!src/index.js",
    "!src/repositories/interfaces/**",
    "!src/repositories/postgres/**",
    "!src/repositories/mongodb/**"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFiles: ["<rootDir>/tests/setup.env.js"]
};

