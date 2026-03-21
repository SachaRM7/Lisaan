// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support expo-sqlite on web (requires .wasm files)
config.resolver.assetExts.push('wasm');

module.exports = config;
