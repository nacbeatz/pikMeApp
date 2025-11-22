// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver alias for react-native-maps on web
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Alias react-native-maps to web-compatible version on web
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // Resolve to web-compatible maps library
    return context.resolveRequest(context, '@teovilla/react-native-web-maps', platform);
  }
  
  // Use default resolver for everything else
  return defaultResolver ? defaultResolver(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

