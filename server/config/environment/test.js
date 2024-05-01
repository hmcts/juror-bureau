;(function(){
  'use strict';

  // Testing specific configuration
  // ==================================
  module.exports = {
    // If anything other than false, logs will be output in terminal using the provided log level as minimum level
    logConsole: 'trace',

    // Value for unit Testing
    unitTesting: true,

    // Response editing,  default=false
    responseEditEnabled: false,

    // rate limiting
    rateLimit: {
      time: 1 * 60 * 1000,
      max: 10000,
      message: 'Too many requests, please try again later. Thank you.',
    },
  };

})();
