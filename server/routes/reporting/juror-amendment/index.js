(function() {
    'use strict';
  
    const auth = require('../../../components/auth');
    const jurorAmendmentController = require('./juror-amendment.controller');
  
    module.exports = function(app) {
      app.get('/reporting/juror-amendment/search',
        'reports.juror-amendment.search.get',
        auth.verify,
        jurorAmendmentController.getJurorAmendmentSearch(app));
  
      app.post('/reporting/juror-amendment/search',
        'reports.juror-amendment.search.post',
        auth.verify,
        jurorAmendmentController.postJurorAmendmentSearch(app));
    };
  
  })();
  