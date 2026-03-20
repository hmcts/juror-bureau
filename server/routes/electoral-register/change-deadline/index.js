(() => {
  'use strict';

  const controller = require('./change-deadline-controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/change-deadline',
      'electoral-register.change-deadline.get',
      auth.verify,
      isBureauManager,
      controller.getChangeDeadline(app)
    );
  };

})();
