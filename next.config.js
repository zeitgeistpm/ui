// pass the modules you would like to see transpiled
//const withTM = require("next-transpile-modules")(["ipfs-http-client"]); // pass the modules you would like to see transpiled

module.exports = {
  experimental: {
    scrollRestoration: true,
    esmExternals: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
      };
    }

    config.externals = [
      ...config.externals,
      {
        //"@substrate/connect": "SubstrateConnect",
        "@substrate/smoldot-light": "SmoldotLightClient",
        "ipfs-http-client": "ipfs-http-client/src/index.js",
      },
    ];

    return config;
  },
};
