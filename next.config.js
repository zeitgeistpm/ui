const { withPlaiceholder } = require("@plaiceholder/next");

module.exports = withPlaiceholder({
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
    esmExternals: true,
  },

  images: {
    domains: ["ipfs-gateway.zeitgeist.pm"],
  },
});
