(() => {
  'use strict';

  const controller = require('./electoral-register.controller');
  const auth = require('../../components/auth');
  const { isBureauUser } = require('../../components/auth/user-type');

  module.exports = function(app) {
    app.get(
      '/electoral-register',
      'electoral-register.get',
      auth.verify,
      isBureauUser,
      controller.getDashboard(app)
    );

    app.post(
      '/electoral-register',
      'electoral-register.post',
      auth.verify,
      isBureauUser,
      controller.postSelectedLocalAuthorities(app)
    );

    app.post(
      '/electoral-register/filter',
      'electoral-register.filter.post',
      auth.verify,
      isBureauUser,
      controller.postLocalAuthorityFilter(app)
    );

    app.get(
      '/electoral-register/filter-status',
      'electoral-register.filter-status.get',
      auth.verify,
      isBureauUser,
      controller.getFilterUploadStatus(app)
    );

    app.post(
      '/electoral-register/check-la',
      'electoral-register.check-la.post',
      auth.verify,
      isBureauUser,
      controller.postCheckLocalAuthority(app)
    )
  };

})();
