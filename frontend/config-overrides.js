module.exports = function override(config, env) {
  // Add any webpack config customizations here
  config.devServer = {
    ...config.devServer,
    allowedHosts: 'all',
  };
  return config;
} 