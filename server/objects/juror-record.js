(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    }
    , includeHeaders = function(body, response) {
      return { 'headers': response.headers, 'data': body };
    }

    // at the moment we only need a simple tab string to identify which tab we want to fetch data for
    // ... if it gets more complex than a simple tab string then I can update this
    , record = {
      resource: 'moj/juror-record',
      get: function(rp, app, jwtToken, tab, jurorNumber, locCode, etag) {
        var reqOptions = _.cloneDeep(options);

        if (typeof etag === 'string') {
          reqOptions.headers['If-None-Match'] = etag;
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.transform = includeHeaders;

        if (tab === 'notes' || tab === 'contact-log') {
          reqOptions.uri = urljoin(reqOptions.uri,
            this.resource,
            tab,
            jurorNumber);
        } else if (tab === 'contact-log/enquiry-types') {
          reqOptions.uri = urljoin(reqOptions.uri,
            this.resource,
            tab);
        } else {
          reqOptions.uri = urljoin(reqOptions.uri,
            this.resource,
            tab,
            `${jurorNumber}`,
            locCode);
        }

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            jurorNumber: jurorNumber,
          },
        });

        return rp(reqOptions);
      },
    }

    , attendanceDetails = {
      resource: 'moj/juror-record/attendance-detail',
      get: function(rp, app, jwtToken, locCode, jurorNumber) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          locCode,
          jurorNumber);

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            locCode,
            jurorNumber,
          },
        });

        return rp(reqOptions);
      },
    }

    , changeDate = {
      resource: 'moj/juror-record/update-attendance',
      patch: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'PATCH';
        reqOptions.body = body;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: body,
        });

        return rp(reqOptions);
      },
    }

    , editDetails = {
      resource: 'moj/juror-record/edit-juror',
      patch: function(rp, app, jwtToken, body, jurorNumber, etag) {
        let reqOptions = _.cloneDeep(options),
          tmpBody = _.clone(body);

        delete tmpBody._csrf;

        if (typeof etag === 'string') {
          reqOptions.headers['If-None-Match'] = etag;
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          jurorNumber);
        reqOptions.method = 'PATCH';

        tmpBody = _.mapKeys(tmpBody, (value, key) => _.snakeCase(key));

        delete Object.assign(tmpBody, {'welsh_language_required': tmpBody.welsh }).welsh;

        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            jurorNumber: jurorNumber,
            body: tmpBody,
          },
        });

        return rp(reqOptions);
      },
    }

    , notes = {
      resource: 'moj/juror-record/notes',
      patch: function(rp, app, jwtToken, body, jurorNumber) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        delete tmpBody._csrf;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          jurorNumber);
        reqOptions.method = 'PATCH';
        reqOptions.body = tmpBody;


        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            jurorNumber: jurorNumber,
            notes: tmpBody,
          },
        });

        return rp(reqOptions);
      },
    }

    , logs = {
      resource: 'moj/juror-record/create/contact-log',
      post: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        delete tmpBody._csrf;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tmpBody,
        });

        return rp(reqOptions);
      },
    }

    , search = {
      resource: 'moj/juror-record/single-search',
      get: function(rp, app, jwtToken, jurorNumber) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          '?jurorNumber=' + jurorNumber);
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            jurorNumber: jurorNumber,
          },
        });

        return rp(reqOptions);
      },
    }

    , opticReferenceObject = {
      resourcePost: 'moj/juror-record/create/optic-reference',
      resourceGet: 'moj/juror-record/optic-reference',
      post: function(rp, app, jwtToken, body, jurorNumber, poolNumber) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        tmpBody.jurorNumber = jurorNumber;
        tmpBody.poolNumber = poolNumber;

        delete tmpBody._csrf;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resourcePost);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tmpBody,
        });

        return rp(reqOptions);
      },
      get: function(rp, app, jwtToken, jurorNumber, poolNumber, hasModAccess) {
        var reqOptions = _.clone(options);

        if (!hasModAccess) {
          return Promise.resolve(null);
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resourceGet,
          jurorNumber,
          poolNumber,
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            jurorNumber,
            poolNumber,
          },
        });

        return rp(reqOptions);
      },
    }

    , changeName = {
      resource: 'moj/juror-record/{part}/{}',
      patch: function(rp, app, jwtToken, jurorNumber, part, payload) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource.replace('{part}', part).replace('{}', jurorNumber),
        );
        reqOptions.method = 'PATCH';
        reqOptions.body = payload;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: payload,
        });

        return rp(reqOptions);
      },
    }

    , failedToAttendObject = {
      resource: 'moj/juror-record/failed-to-attend',
      patch: function(rp, app, jwtToken, jurorNumber, poolNumber, undo) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource.replace('{}', jurorNumber));
        reqOptions.method = 'PATCH';
        reqOptions.body = {
          'juror_number': jurorNumber,
          'pool_number': poolNumber,
        };

        if (undo) reqOptions.uri += '/undo';

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

    , jurorDetailsObject = {
      resource: 'moj/juror-record/details',
      post: function(rp, app, jwtToken, jurorNumber, jurorVersion, includeDetails) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = [
          {
            'juror_number': jurorNumber,
            'juror_version': jurorVersion,
            'include': includeDetails,
          },
        ];



        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  const jurorOverviewDAO = new DAO('moj/juror-record/overview', {
    get: function(jurorNumber, loc) {
      return { uri: urljoin(this.resource, jurorNumber, loc)};
    },
  });

  module.exports.record = record;
  module.exports.attendanceDetails = attendanceDetails;
  module.exports.changeDate = changeDate;
  module.exports.editDetails = editDetails;
  module.exports.notes = notes;
  module.exports.contactLog = logs;
  module.exports.search = search;
  module.exports.opticReferenceObject = opticReferenceObject;
  module.exports.changeName = changeName;
  module.exports.failedToAttendObject = failedToAttendObject;
  module.exports.jurorDetailsObject = jurorDetailsObject;
  module.exports.jurorOverviewDAO = jurorOverviewDAO;

  const rp = require('request-promise');

  module.exports.disqualifyAgeDAO = {
    patch: function(app, req, jurorNumber) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/disqualify/juror', jurorNumber, 'age'),
        method: 'PATCH',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  // new DAO

  module.exports.expensesSummaryDAO = new DAO('moj/expenses/{locCode}/{jurorNumber}/summary/totals', {
    get: function(jurorNumber, locCode) {
      return { uri: urljoin(this.resource.replace('{locCode}', locCode).replace('{jurorNumber}', jurorNumber)) };
    },
  });

})();
