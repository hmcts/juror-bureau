(() => {
  'use strict';

  const controller = require('./set-deadline-controller');
  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register/set-deadline',
      'electoral-register.set-deadline.get',
      auth.verify,
      isBureauUser,
      controller.getSetDeadline(app)
    );

    app.post(
      '/electoral-register/set-deadline',
      'electoral-register.set-deadline.post',
      auth.verify,
      isBureauUser,
      controller.postSetDeadline(app)
    );
  };

})();
