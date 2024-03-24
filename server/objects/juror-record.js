(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.jurorRecordDAO = new DAO('moj/juror-record', {
    get: function(tab, jurorNumber, locCode, etag) {
      let headers = {};
      let uri;

      if (typeof etag === 'string') {
        headers['If-None-Match'] = etag;
      }

      if (tab === 'notes' || tab === 'contact-log' || tab === 'contact-log/enquiry-types') {
        uri = urljoin(this.resource, tab, jurorNumber);
      } else {
        uri = urljoin(this.resource, tab, jurorNumber, locCode);
      }

      // TODO: this is temp until all tabs have a backend endpoint
      if (tab === 'attendance') {
        return { debug: Promise.resolve({ foo: 'bar' }) };
      }

      return { uri, headers };
    }}
  );

  module.exports.editJurorRecordDAO = new DAO('moj/juror-record/edit-juror', {
    patch: function(body, jurorNumber, etag) {
      const uri = urljoin(this.resource, jurorNumber);
      const payload = { ...body };
      const headers = {};

      delete payload._csrf;

      if (typeof etag === 'string') {
        headers['If-None-Match'] = etag;
      }

      return {uri, body: payload, headers};
    }}
  );

  module.exports.editJurorNotesDAO = new DAO('moj/juror-record/notes', {
    patch: function(body, jurorNumber) {
      const uri = urljoin(this.resource, jurorNumber);
      const payload = { ...body };

      delete payload._csrf;

      return { uri, body: payload };
    }}
  );

  module.exports.editJurorContactLogDAO = new DAO('moj/juror-record/create/contact-log', {
    post: function(body) {
      const payload = { ...body };

      delete payload._csrf;

      return { body: payload };
    }}
  );

  module.exports.jurorSingleSearchDAO = new DAO('moj/juror-record/single-search', {
    get: function(jurorNumber) {
      const uri = urljoin(this.resource, '?jurorNumber=' + jurorNumber);

      return { uri };
    }}
  );

  module.exports.createOpticReferenceDAO = new DAO('moj/juror-record/create/optic-reference', {
    post: function(body, jurorNumber, poolNumber) {
      const payload = {
        ...body,
        jurorNumber,
        poolNumber,
      };

      delete payload._csrf;

      return { body: payload };
    }}
  );

  module.exports.opticReferenceDAO  = new DAO('moj/juror-record/optic-reference', {
    get: function(jurorNumber, poolNumber, hasModAccess) {
      // Not a fan of this, access should be pre-call and/or managed on the API
      if (!hasModAccess) {
        return { debug: Promise.resolve(null) };
      }

      const uri = urljoin(
        this.resource,
        jurorNumber,
        poolNumber,
      );

      return { uri };
    }}
  );

  module.exports.changeNameDAO = new DAO('moj/juror-record', {
    patch: function(jurorNumber, part, payload) {
      const uri = urljoin(
        this.resource,
        part,
        jurorNumber,
      );

      return { uri, body: payload };
    }}
  );

  module.exports.failedToAttendDAO = new DAO('moj/juror-record/failed-to-attend/', {
    patch: function(jurorNumber, failedToAttend) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = { failedToAttend };

      return { uri, body, debug: Promise.resolve() };
    }}
  );

})();
