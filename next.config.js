const { withPlaiceholder } = require("@plaiceholder/next");
const withBundleAnalyzer = require("@next/bundle-analyzer");

module.exports = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(
  withPlaiceholder({
    reactStrictMode: true,
    experimental: {
      scrollRestoration: true,
      esmExternals: true,
    },

    images: {
      domains: ["ipfs-gateway.zeitgeist.pm"],
    },
  }),
  {},
);
