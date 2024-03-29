require('@hmcts/properties-volume').addTo(require('config'));

global.sleep = (ms = 1000) => {
  return new Promise(res => setTimeout(res, ms));
};

// Export the application
exports = module.exports = require('./app');
