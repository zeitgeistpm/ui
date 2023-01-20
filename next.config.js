const { withPlaiceholder } = require("@plaiceholder/next");

module.exports = withPlaiceholder({
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        pako: false,
        ...config.resolve.fallback,
      };
    }

    // config.externals = [
    //   ...config.externals,
    //   {
    //     "@substrate/connect": "SubstrateConnect",
    //     "@substrate/smoldot-light": "SmoldotLightClient",
    //   },
    // ];

    return config;
  },
  images: {
    domains: ["ipfs-gateway.zeitgeist.pm"],
  },
});
