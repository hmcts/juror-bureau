(function() {
  'use strict';

  const { getDocuments } = require('./documents.controller')
    , { getListLetters,
      postListLetters,
      checkJuror,
      deletePendingLetter } = require('./letters-list/letters-list.controller')
    , auth = require('../../components/auth');

  const {
    getDocumentForm,
    postDocumentForm,
  } = require('./document-form.controller');

  module.exports = function(app) {
    app.get('/documents',
      'documents.get',
      auth.verify,
      getDocuments(app));

    app.get('/documents/:document',
      'documents.form.get',
      auth.verify,
      getDocumentForm(app));

    app.post('/documents/:document',
      'documents.form.post',
      auth.verify,
      postDocumentForm(app));

    app.get('/documents/:document/letters-list',
      'documents.letters-list.get',
      auth.verify,
      getListLetters(app));

    app.post('/documents/:document/letters-list',
      'documents.letters-list.post',
      auth.verify,
      postListLetters(app));

    // ajax route to delete a letter from the printing queue
    app.delete('/documents/:document/letters-list/delete-letter',
      'documents.letters-list.delete',
      auth.verify,
      deletePendingLetter(app));

    // ajax route for checking and unchecking jurors from the documents list
    app.post('/documents/:document/letters-list/check-juror',
      'documents.letters-list.check.post',
      auth.verify,
      checkJuror(app));
  };

})();
