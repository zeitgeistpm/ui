const withTM = require("next-transpile-modules")([
  "@zeitgeistpm/sdk",
  "@zeitgeistpm/utility",
  "@zeitgeistpm/web3.storage",
  "@zeitgeistpm/rpc",
  "@zeitgeistpm/indexer",
]); // pass the modules you would like to see transpiled

module.exports = withTM({
  reactStrictMode: true,
  swcMinify: true,
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
