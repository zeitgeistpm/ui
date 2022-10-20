// pass the modules you would like to see transpiled
const withTM = require("next-transpile-modules")([
  "@zeitgeistpm/sdk",
  "@zeitgeistpm/web3.storage",
  "ipfs-http-client",
]); // pass the modules you would like to see transpiled

module.exports = withTM({
  experimental: {
    scrollRestoration: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        pako: false,
        ...config.resolve.fallback,
      };
    }

    config.externals = [
      ...config.externals,
      {
        //"@substrate/connect": "SubstrateConnect",
        "@substrate/smoldot-light": "SmoldotLightClient",
      },
    ];

    return config;
  },
});
