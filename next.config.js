const { withPlaiceholder } = require("@plaiceholder/next");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: false,
});

module.exports = withBundleAnalyzer(
  withBundleAnalyzer({
    reactStrictMode: true,
    experimental: {
      scrollRestoration: true,
      esmExternals: true,
    },

    images: {
      domains: ["ipfs-gateway.zeitgeist.pm"],
    },
  }),
);
