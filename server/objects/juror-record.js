(function() {
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;
  const { extractDataAndHeadersFromResponse, mapCamelToSnake, replaceAllObjKeys } = require('../lib/mod-utils')

  module.exports.record = new DAO('moj/juror-record', {
    get: function(tab, jurorNumber, locCode, etag) {
      const headers = {}; 
      let uri;
      if (typeof etag === 'string') {
        headers['If-None-Match'] = etag;
      }

      if (tab === 'notes' || tab === 'contact-log') {
        uri = urljoin(this.resource, tab, jurorNumber);
      } else if (tab === 'contact-log/enquiry-types') {
        uri = urljoin(this.resource, tab);
      } else {
        uri = urljoin(this.resource, tab, jurorNumber, locCode);
      }

      return { 
        uri,
        headers,
        transform: extractDataAndHeadersFromResponse('data')
      };
    }
  });

  module.exports.attendanceDetails = new DAO('moj/juror-record/attendance-detail', {
    get: function(jurorNumber) {
      return { uri: urljoin(this.resource, jurorNumber) };
    }
  });

  module.exports.changeDate = new DAO('moj/juror-record/update-attendance');

  module.exports.editDetails = new DAO('moj/juror-record/edit-juror', {
    patch: function(body, jurorNumber, etag) {
      const headers = {};
      if (typeof etag === 'string') {
        headers['If-None-Match'] = etag;
      }

      body = mapCamelToSnake(_.clone(body));
      delete Object.assign(body, {'welsh_language_required': body.welsh || false }).welsh;

      return {
        uri: urljoin(this.resource, jurorNumber),
        body,
      }
    }
  });

  module.exports.notes = new DAO('moj/juror-record/notes', {
    patch: function(body, jurorNumber) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        body
      }
    }
  });

  module.exports.contactLog = new DAO('moj/juror-record/create/contact-log');

  module.exports.search = new DAO('moj/juror-record/single-search', {
    get: function(jurorNumber) {
      return { uri: urljoin(this.resource, '?jurorNumber=' + jurorNumber) };
    }
  });

  module.exports.opticReferenceObject = new DAO('moj/juror-record/optic-reference', {
    get: function(jurorNumber, poolNumber) {
      return { 
        uri: urljoin(this.resource, jurorNumber, poolNumber),
        transform: (data) => { return data.data },
      };
    },
    post: function(body, jurorNumber, poolNumber) {
      body.jurorNumber = jurorNumber;
      body.poolNumber = poolNumber;
      return {
        uri: urljoin('moj/juror-record/create/optic-reference', ),
        body
      }
    }
  });

  module.exports.changeName = new DAO('moj/juror-record/{part}/{jurorNumber}', {
    patch: function(jurorNumber, part, body) {
      return { 
        uri: this.resource.replace('{part}', part).replace('{jurorNumber}', jurorNumber),
        body
      };
    },
  });

  module.exports.failedToAttendObject = new DAO('moj/juror-record/failed-to-attend', {
    patch: function(jurorNumber, poolNumber, undo) {
      const body = {
        'juror_number': jurorNumber,
        'pool_number': poolNumber,
      };
      const uri = this.resource;

      if (undo) uri += '/undo';

      return { uri, body };
    }
  });

  module.exports.jurorOverviewDAO = new DAO('moj/juror-record/overview', {
    get: function(jurorNumber, loc) {
      return { uri: urljoin(this.resource, jurorNumber, loc)};
    },
  });;

  module.exports.disqualifyAgeDAO = new DAO('moj/disqualify/juror/{jurorNumber}/age', {
    patch: function(jurorNumber) {
      return { uri: this.resource.replace('{jurorNumber}', jurorNumber) };
    },
  })

  module.exports.expensesSummaryDAO = new DAO('moj/expenses/{locCode}/{jurorNumber}/summary/totals', {
    get: function(jurorNumber, locCode) {
      return { uri: urljoin(this.resource.replace('{locCode}', locCode).replace('{jurorNumber}', jurorNumber)) };
    },
  });

  module.exports.searchJurorRecordDAO = new DAO('moj/juror-record/search');

  module.exports.jurorRecordDetailsDAO = new DAO('moj/juror-record/details');

  module.exports.jurorRecordSimpleDetailsDAO = new DAO('moj/juror-record/simple-details', {
    post: function(jurorNumbers, locCode) {
      return {
        uri: this.resource,
        body: {
          juror_numbers: jurorNumbers,
          court_code: locCode,
        },
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data.juror_details, _.camelCase) }
      }
    }
  })

})();
