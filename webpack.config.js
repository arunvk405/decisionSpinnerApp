const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Crucial for Chrome Extensions: Set the publicPath to './'
  // This ensures that all generated asset URLs in index.html are relative
  // to the location of index.html itself, rather than absolute paths
  // which Chrome extensions interpret incorrectly.
  config.output.publicPath = './';

  // Keep the CSP-compliant devtool setting from our previous discussion
  if (config.mode === 'development') {
    config.devtool = 'source-map';
  }

  return config;
};