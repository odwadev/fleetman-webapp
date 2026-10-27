module.exports = function (config) {
  const path = require('path');
  const root = path.resolve(__dirname, '..');
  require(path.join(root, 'karma.conf.js'))(config);
  config.set({
    basePath: root,
    customLaunchers: {
      CIChrome: {base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-dev-shm-usage']}
    },
    browsers: ['CIChrome'],
    singleRun: true,
    autoWatch: false,
    reporters: ['progress']
  });
};
