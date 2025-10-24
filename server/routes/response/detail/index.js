/* eslint-disable max-len */
;(function(){
  'use strict';

  const controller = require('./detail.controller');
  const auth = require('../../../components/auth');
  const responseCountMiddleware = require('../../../objects/responses').object;
  const { checkRouteParam } = require('../../../lib/mod-utils');

  module.exports = function(app) {
    // Mark as responded modal
    app.get('/response/:id/responded/:type', 'response.detail.responded.get', auth.verify, checkRouteParam('type', ['paper', 'digital']), controller.getResponded(app));
    app.post('/response/:id/responded/:type', 'response.detail.responded.post', auth.verify, checkRouteParam('type', ['paper', 'digital']), controller.postResponded(app));

    // Update status to awaiting information
    app.get('/response/:id/awaiting-information/:type', 'response.detail.awaiting.information.get', auth.verify, checkRouteParam('type', ['paper', 'digital']), controller.getAwaitingInformation(app));
    app.post('/response/:id/awaiting-information/:type', 'response.detail.awaiting.information.post', auth.verify, checkRouteParam('type', ['paper', 'digital']), controller.postAwaitingInformation(app));

    // Download PDF
    app.get('/response/:id/download-pdf', 'response.detail.download-pdf.get', auth.verify, controller.getDownloadPDF(app));

    // Standard page load
    app.get('/response/:id', 'response.detail.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));
  };
})();
