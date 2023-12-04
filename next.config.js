const { withPlaiceholder } = require("@plaiceholder/next");

module.exports = withPlaiceholder({
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
    scrollRestoration: true,
  },
  images: {
    domains: [
      "ipfs-gateway.zeitgeist.pm",
      "cdn.discordapp.com",
      "images.unsplash.com",
    ],
  },
  staticPageGenerationTimeout: 300, //5 mins
  transpilePackages: ["@0xsquid/widget"],
});
