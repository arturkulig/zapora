/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  collectCoverage: true,
  collectCoverageFrom: [
    "./**/*.ts",
    "!./**/*.spec.ts",
    "!./internal/*.ts",
    "!./tests/*.ts",
  ],
  coverageDirectory: "./coverage",
  coverageReporters: ["text"],
  coverageProvider: "babel",
};
