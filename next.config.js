const { withPlaiceholder } = require("@plaiceholder/next");
const withBundleAnalyzer = require("@next/bundle-analyzer");

module.exports = withPlaiceholder({
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  images: {
    domains: ["ipfs-gateway.zeitgeist.pm"],
  },
});
