const path = require("path");

module.exports = {
  experimental: {
    scrollRestoration: true,
  },
  webpack: (config) => {
    config.resolve.alias.pako$ = path.resolve(
      __dirname,
      "node_modules/pako/dist/pako.js"
    );
    return config;
  },
};
