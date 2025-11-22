// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver to block @rnmapbox/maps on web
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block @rnmapbox/maps and mapbox-gl on web to prevent CSS import errors
  if (platform === 'web' && (moduleName === '@rnmapbox/maps' || moduleName === 'mapbox-gl')) {
    // Return empty stub module for web
    return {
      filePath: __dirname + '/app/(tabs)/map.web.tsx',
      type: 'sourceFile',
    };
  }
  
  // Use default resolver for everything else
  return defaultResolver ? defaultResolver(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

