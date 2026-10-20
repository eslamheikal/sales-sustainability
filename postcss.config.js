module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: true,
        minifySelectors: true,
        minifyFontValues: true,
        colormin: true,
        calc: true,
        convertValues: true,
        discardDuplicates: true,
        discardEmpty: true,
        mergeRules: true,
        reduceIdents: false, // Keep this false to avoid breaking Angular component styles
        zindex: false, // Keep this false to avoid z-index conflicts
      }],
    }),
  ],
};
