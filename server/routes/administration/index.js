(function() {
  'use strict';

  const auth = require('../../components/auth');

  module.exports = function(app) {
    require('./system-codes')(app);
  };

})();
