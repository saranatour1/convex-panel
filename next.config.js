const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add Monaco Editor webpack plugin
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ['javascript', 'typescript', 'json'],
          filename: 'static/[name].worker.js',
        })
      );

      // Configure proper handling of Monaco Editor's ESM workers
      config.resolve.alias = {
        ...config.resolve.alias,
        'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api'
      };

      // Enable loading of ESM modules
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
        topLevelAwait: true,
      };

      // Add fallback for dynamic imports
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'monaco-editor/esm/vs/base/common/worker/simpleWorker': false
      };

      // Fix module resolution for ESM packages
      config.module.rules.push({
        test: /\.m?js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      });

      // Handle ESM imports
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.mts'],
        '.cjs': ['.cjs', '.cts'],
      };
    }

    // Important: Return the modified config
    return config;
  },
  // Add transpilePackages to handle ESM modules
  transpilePackages: [
    'monaco-editor',
    '@monaco-editor/react',
    'convex-panel'
  ],
};

module.exports = nextConfig; 