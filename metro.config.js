const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Support expo-sqlite on web (requires .wasm files)
config.resolver.assetExts.push('wasm');

// Fix: force certains packages à être transpilés pour le web
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Fix: zustand charge son build ESM (middleware.mjs) qui utilise import.meta
// → forcer la résolution vers le build CJS sur toutes les plateformes
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand/middleware') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
