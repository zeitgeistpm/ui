const { withPlaiceholder } = require("@plaiceholder/next");

module.exports = withPlaiceholder({
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  images: {
    domains: [
      "ipfs-gateway.zeitgeist.pm",
      "cdn.discordapp.com",
      "images.unsplash.com",
    ],
  },
});
