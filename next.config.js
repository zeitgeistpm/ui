const { withPlaiceholder } = require("@plaiceholder/next");

const withPWA = require("next-pwa")({
  dest: "public",
  // disable: process.env.NODE_ENV === 'development',
  // register: true,
  // scope: '/app',
  // sw: 'service-worker.js',
  //...
});

module.exports = withPWA(
  withPlaiceholder({
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
  }),
);
