/* eslint-disable max-len */
;(function(){
  'use strict';

  const controller = require('./detail.controller');
  const auth = require('../../../components/auth');
  const responseCountMiddleware = require('../../../objects/responses').object;
  const { paper, paperOrDigital } = require('../../../components/route-parameter-constraints');

  module.exports = function(app) {
    // Mark as responded modal
    app.get('/response/:id/responded/:type', 'response.detail.responded.get', paperOrDigital, auth.verify, controller.getResponded(app));
    app.get('/response/:id/responded', auth.verify, controller.getResponded(app));
    app.post('/response/:id/responded/:type', 'response.detail.responded.post', paperOrDigital, auth.verify, controller.postResponded(app));
    app.post('/response/:id/responded', auth.verify, controller.postResponded(app));

    // Update status to awaiting information
    app.get('/response/:id/awaiting-information/:type', 'response.detail.awaiting.information.get', paper, auth.verify, controller.getAwaitingInformation(app));
    app.get('/response/:id/awaiting-information', auth.verify, controller.getAwaitingInformation(app));
    app.post('/response/:id/awaiting-information/:type', 'response.detail.awaiting.information.post', paper, auth.verify, controller.postAwaitingInformation(app));
    app.post('/response/:id/awaiting-information', auth.verify, controller.postAwaitingInformation(app));

    // Download PDF
    app.get('/response/:id/download-pdf', 'response.detail.download-pdf.get', auth.verify, controller.getDownloadPDF(app));

    // Standard page load
    app.get('/response/:id', 'response.detail.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));
  };
})();
