(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./administration.controller');

  module.exports = function(app) {
    require('./system-codes')(app);
    require('./expense-limits')(app);
    require('./non-sitting-days')(app);
    require('./users')(app);
    require('./room-locations')(app);
    require('./court-details')(app);
    require('./courts-and-bureau')(app);
    require('./judges')(app);
    require('./bank-holidays')(app);

    app.get('/administration',
      'administration.get',
      auth.verify,
      controller.getAdministration(app)
    );
  };

})();
