module.exports = {
  parserOptions: {
    project: "./tsconfig.strictNullChecks.json",
  },
  plugins: ["strict-null-checks"],
  rules: {
    "strict-null-checks/all": "warn",
  },
};
