module.exports = {
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

    return config;
  },
};
