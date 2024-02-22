;(function(){
  'use strict';

  const _ = require('lodash');
  const staffRosterObj = require('../../objects/staff-roster').object;
  const validate = require('validate.js');
  const { searchResponsesDAO } = require('../../objects/search.js');
  const validator = require('../../config/validation/search.js');

  module.exports.index = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      // if the user refresh by clicking the url bar and pressing enter we reset the results list
      delete req.session.searchResponse;

      try {
        let staffList;

        if (req.session.authentication.staff !== null && req.session.authentication.staff.rank > 0) {
          staffList = await staffRosterObj.get(require('request-promise'), app, req.session.authToken);
        }

        return res.render('search/index', {
          staffList,
          searchParams: tmpFields,
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
      let validatorResult;

      const sendValidationError = (errors) => {
        req.session.errors = errors;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('search.get'));
      };

      delete req.session.errors;
      delete req.session.formFields;

      if (req.body.juror_number.trim().length !== 0 && req.body.juror_number.trim().length !== 9) {
        validatorResult = {
          jurorNumber: [
            {
              summary: 'Juror number must be 9 characters',
              summaryLink: 'jurorNumber',
              details: 'Juror number must be 9 characters',
            },
          ],
        };
      }

      if (req.body.pool_number.trim().length !== 0 && req.body.pool_number.trim().length !== 9) {
        validatorResult = {
          ...validatorResult,
          poolNumber: [
            {
              summary: 'Pool number must be 9 characters',
              summaryLink: 'poolNumber',
              details: 'Pool number must be 9 characters',
            },
          ],
        };
      }

      if (typeof validatorResult !== 'undefined') {
        return sendValidationError(validatorResult);
      }

      // Validate search parameters
      validatorResult = validate(req.body, validator.searchParameters(req));

      if (typeof validatorResult !== 'undefined') {
        return sendValidationError(validatorResult);
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

      if (payload.last_name) {
        payload['last_name_display'] = payload.last_name;
        payload['last_name'] = payload.last_name.toUpperCase();
      }

      if (payload.processing_status) {
        if (!Array.isArray(payload.processing_status)){
          payload['processing_status'] = [payload.processing_status];
        }

        for (const status in payload.processing_status){
          if (typeof status !== 'undefined') {
            switch (payload.processing_status[status]) {
            case 'TODO':
              searchParams['is_todo'] = true;
              break;
            case 'AWAITING_COURT_REPLY':
              searchParams['is_awaiting_court_reply'] = true;
              break;
            case 'AWAITING_CONTACT':
              searchParams['is_awaiting_contact'] = true;
              break;
            case 'AWAITING_TRANSLATION':
              searchParams['is_awaiting_translation'] = true;
              break;
            case 'CLOSED':
              searchParams['is_completed'] = true;
              break;
            }
          }
        }
      }

      let staff;
      let responses = {
        'juror_response': [],
      };
      let resultsStr;

      try {
        promiseArr.push(staffRosterObj.get(require('request-promise'), app, req.session.authToken));
        promiseArr.push(searchResponsesDAO.post(app, req, payload));

        const response = await Promise.all(promiseArr);

        staff = response[0];
        responses = response[1];

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

        resultsStr = buildSearchString(payload);

      } catch (err) {

        app.logger.crit('Failed to fetch search results: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            params: req.session.searchParams,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

      } finally {
        res.render('search/index', {
          staffList: staff,
          responses,
          searchParams,
          resultsStr,
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
    if (payload.last_name_display) {
      str.push(`"${payload.last_name_display}"`);
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
      CLOSED: 'Completed',
    };

    return statuses[originalStatus];
  }

})();

