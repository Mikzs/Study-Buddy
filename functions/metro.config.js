const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ Tell Metro to resolve firebase/auth using the react-native field
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
];

module.exports = config;