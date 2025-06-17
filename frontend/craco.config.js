module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        // Ignore warnings raised by source-map-loader.
        // Some third party packages may contain missing source maps.
        function ignoreSourcemapsLoaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ],
    },
  },
}; 