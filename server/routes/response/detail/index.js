/* eslint-disable max-len */
;(function(){
  'use strict';

  var controller = require('./detail.controller')
    , auth = require('../../../components/auth')
    , responseCountMiddleware = require('../../../objects/responses').object;

  module.exports = function(app) {
    // Ajax fetched notes
    app.get('/response/:id/notes', 'response.detail.notes.post', auth.verify, controller.getNotes(app));
    app.post('/response/:id/notes', 'response.detail.notes.post', auth.verify, controller.postNotes(app));
    app.get('/response/:id/notes/edit', 'response.detail.notes.edit.get', auth.verify, controller.getEditNotes(app));
    app.post('/response/:id/notes/edit', 'response.detail.notes.edit.post', auth.verify, controller.postEditNotes(app));

    // Call log
    app.get('/response/:id/call-log', 'response.detail.call-log.get', auth.verify, controller.getCallLog(app));
    app.post('/response/:id/call-log', 'response.detail.call-log.post', auth.verify, controller.postCallLog(app));

    // Mark as disqualified modal
    app.get('/response/:id/disqualify', 'response.detail.disqualify.get', auth.verify, controller.getDisqualify(app));
    app.post('/response/:id/disqualify', 'response.detail.disqualify.post', auth.verify, controller.postDisqualify(app));

    // Update status to awaiting information
    app.get('/response/:id/awaiting-information/:type(\paper)?', 'response.detail.awaiting.information.get', auth.verify, controller.getAwaitingInformation(app));
    app.post('/response/:id/awaiting-information/:type(\paper)?', 'response.detail.awaiting.information.post', auth.verify, controller.postAwaitingInformation(app));

    // Mark as excused
    app.get('/response/:id/excusal', 'response.detail.excusal.get', auth.verify, controller.getExcusal(app));
    app.post('/response/:id/excusal', 'response.detail.excusal.post', auth.verify, controller.postExcusal(app));

    //app.post('/response/:id/excusal/reject', 'response.detail.excusal.reject.post', auth.verify, controller.postExcusalReject(app));
    //app.post('/response/:id/excusal/accept', 'response.detail.excusal.accept.post', auth.verify, controller.postExcusalAccept(app));

    // Mark as deferred
    app.get('/response/:id/deferral', 'response.detail.deferral.get', auth.verify, controller.getDeferral(app));
    app.post('/response/:id/deferral', 'response.detail.deferral.post', auth.verify, controller.postDeferral(app));

    // Mark as responded modal
    app.get('/response/:id/responded/:type(paper|digital)?', 'response.detail.responded.get', auth.verify, controller.getResponded(app));
    app.post('/response/:id/responded/:type(paper|digital)?', 'response.detail.responded.post', auth.verify, controller.postResponded(app));

    // Add note for response edit reason
    app.get('/response/:id/change-log', 'response.detail.change-log.get', auth.verify, controller.getChangeLog(app));
    // app.post('/response/:id/change-log', 'response.detail.change-log.post', auth.verify, controller.postChangeLog(app));

    // Edit Juror Details
    app.post('/response/:id/edit/validate', 'response.edit.validate.post', auth.verify, controller.validateEdit(app));
    app.post('/response/:id/edit', 'response.edit.post', auth.verify, controller.edit(app));

    // Download PDF
    app.get('/response/:id/download-pdf', 'response.detail.download-pdf.get', auth.verify, controller.getDownloadPDF(app));

    // Bureau Status
    app.get('/response/:id/bureaustatus', 'reponse.detail.bureaustatus.get', auth.verify, controller.getBureauStatus(app));
    app.post('/response/:id/bureaustatus', 'reponse.detail.bureaustatus.post', auth.verify, controller.postBureauStatus(app));

    // Status Completed
    app.get('/response/:id/completed', 'reponse.detail.completed.get', auth.verify, controller.getCompleted(app));

    // Send to Court
    app.get('/response/:id/sendcourt', 'response.detail.sendcourt.get', auth.verify, controller.getSendToCourt(app));
    app.post('/response/:id/sendcourt', 'response.detail.sendcourt.post', auth.verify, controller.postSendToCourt(app));

    // Standard page load
    app.get('/response/:id', 'response.detail.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));
    app.post('/response/:id', 'response.detail.post', auth.verify, controller.post(app));
  };
})();
