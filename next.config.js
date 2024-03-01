const { withPlaiceholder } = require("@plaiceholder/next");

module.exports = withPlaiceholder({
  async redirects() {
    return [
      {
        source: "/leaderboard",
        destination: "/404",
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
    scrollRestoration: true,
  },
  images: {
    minimumCacheTTL: 10800,
    domains: [
      "ipfs-gateway.zeitgeist.pm",
      "cdn.discordapp.com",
      "images.unsplash.com",
      "cdn.sanity.io",
    ],
  },
  staticPageGenerationTimeout: 300, //5 mins
});
