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
      "s2.coinmarketcap.com",
    ],
  },
  staticPageGenerationTimeout: 300, //5 mins
  transpilePackages: ["@0xsquid/widget"],
});
