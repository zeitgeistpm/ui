const { withPlaiceholder } = require("@plaiceholder/next");

module.exports = withPlaiceholder({
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
  webpack: (config, { isServer, dev }) => {
    if (dev && !isServer) {
      // Suppress React warnings about fetchPriority in development
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        if (entries['main.js'] && !entries['main.js'].includes('./lib/suppress-warnings.js')) {
          entries['main.js'].unshift('./lib/suppress-warnings.js');
        }
        return entries;
      };
    }
    return config;
  },
});
