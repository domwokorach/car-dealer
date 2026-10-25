const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  // Named themes must be registered here or setTheme() throws.
  extraThemes: ['moon', 'moon-dark', 'grass', 'grass-dark'],
});
