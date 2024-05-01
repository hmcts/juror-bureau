;(function(){
  'use strict';

  // Production specific configuration
  // =================================
  module.exports = {
    // If true, logs will be output in terminal as well as saved to file
    logConsole: 'debug',

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
