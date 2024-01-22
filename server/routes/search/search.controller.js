;(function(){
  'use strict';

  const _ = require('lodash');
  const staffRosterObj = require('../../objects/staff-roster').object;
  const validate = require('validate.js');
  const { searchResponsesDAO } = require('../../objects/search.js');

  module.exports.index = function(app) {
    return async function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);

      delete req.session.errors;

      // if the user refresh by clicking the url bar and pressing enter we reset the results list
      delete req.session.searchResponse;

      try {
        let staffList;

        if (req.session.authentication.staff !== null && req.session.authentication.staff.rank > 0) {
          staffList = await staffRosterObj.get(require('request-promise'), app, req.session.authToken);
        }

        return res.render('search/index', {
          staffList,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch data for search page load: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.search = function(app) {
    return async function(req, res) {
      const promiseArr = [];

      delete req.session.errors;
      delete req.session.formFields;

      // Validate search parameters
      const validatorResult = validate(req.body, require('../../config/validation/search.js')(req));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('search.get', {
          id: req.body.jurorNumber,
        }));
      }

      // build a payload to send
      const payload = {};

      for (let key of Object.keys(req.body)) {
        if (req.body[key] !== '') {
          payload[key] = req.body[key];
        }
      }

      delete payload._csrf;

      const searchParams = _.clone(payload);

      if (payload.processing_status) {
        switch (payload.processing_status) {
        case 'TODO':
          searchParams['is_todo'] = true;
          break;
        case 'AWAITING_COURT_REPLY':
          searchParams['is_awaiting_court_reply'] = true;
          break;
        case 'AWAITING_JUROR_REPLY':
          searchParams['is_awaiting_juror_reply'] = true;
          break;
        case 'AWAITING_TRANSLATION':
          searchParams['is_awaiting_translation'] = true;
          break;
        case 'COMPLETED':
          searchParams['is_completed'] = true;
          break;
        }
      }

      let staff;

      try {
        staff = await staffRosterObj.get(require('request-promise'), app, req.session.authToken);
        const responses = await searchResponsesDAO.post(app, req, payload);

        responses.juror_response.forEach(responsesListIterator(staff));

        req.session.searchResponse = {
          staff,
          responses,
          searchParams,
        };

        app.logger.info('Fetched search results: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            params: req.session.searchParams,
          },
          response: _.merge(staff, responses),
        });

        const resultsStr = buildSearchString(payload);

        return res.render('search/index', {
          staffList: staff,
          responses,
          searchParams,
          resultsStr,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch search results: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            params: req.session.searchParams,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('search/index', {
          staffList: staff,
          responses: {
            'juror_response': [],
          },
          searchParams,
        });
      }
    };
  };

  module.exports.searchClear = function(app) {
    return function(req, res) {
      delete req.session.searchResponse;
      return res.redirect(app.namedRoutes.build('search.get'));
    };
  };

  function buildSearchString(payload) {
    const str = [];

    if (payload.juror_number) {
      str.push(`"${payload.juror_number}"`);
    }
    if (payload.last_name) {
      str.push(`"${payload.last_name}"`);
    }
    if (payload.pool_number) {
      str.push(`"${payload.pool_number}"`);
    }
    if (payload.is_urgent) {
      str.push('"is urgent"');
    }

    return str.join(', ');
  }

  function responsesListIterator(staff) {
    return function(r) {
      r['juror_name'] = r.first_name + ' ' + r.last_name;
      r['date_received'] = r.date_received.join('-');

      const staffAssigned = staff.find((s) => s.login === r.officer_assigned);

      if (staffAssigned) {
        r['officer_assigned'] = staffAssigned.name;
      } else {
        r['officer_assigned'] = '-';
      }

      r['reply_status'] = resolveProcessingStatus(r.reply_status);
    };
  }

  function resolveProcessingStatus(originalStatus) {
    const statuses = {
      TODO: 'To do',
      'AWAITING_COURT_REPLY': 'Awaiting court reply',
      'AWAITING_CONTACT': 'Awaiting juror reply',
      'AWAITING_TRANSLATION': 'Awaiting translation',
      COMPLETED: 'Completed',
    };

    return statuses[originalStatus];
  }

})();

