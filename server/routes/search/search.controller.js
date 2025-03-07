;(function(){
  'use strict';

  const _ = require('lodash');
  const staffRosterObj = require('../../objects/staff-roster').object;
  const validate = require('validate.js');
  const { searchResponsesDAO } = require('../../objects/search.js');
  const validator = require('../../config/validation/search.js');
  const { dateFilter } = require('../../components/filters');
  const { isTeamLeader } = require('../../components/auth/user-type.js');

  module.exports.index = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = typeof req.session.searchResponse !== 'undefined' ? _.clone(req.session.searchResponse.searchParams) : _.clone(req.session.formFields);
      let responses;
      let resultsStr;

      delete req.session.errors;
      delete req.session.formFields;

      if (typeof req.session.searchResponse !== 'undefined') {
        responses = req.session.searchResponse.responses;
        resultsStr = req.session.searchResponse.resultsStr;
      }

      try {
        let staffList;

        if (isTeamLeader(req, res)) {
          staffList = await staffRosterObj.get(req);
          staffList.unshift({
            login: 'AUTO',
            name:'AUTO'
          });
        }

        // always reset the staff list here
        req.session.staffList = _.clone(staffList);

        if (tmpFields && tmpFields['officer_assigned']){
          tmpFields['officer_assigned'] = tmpFields && tmpFields['officer_assigned'] 
            ? staffList?.find((staff) => staff.name.toLowerCase() === tmpFields['officer_assigned'].toLowerCase()).name 
            : null;
        }

        return res.render('search/index', {
          staffList: flattenStaffList(staffList),
          responses,
          resultsStr,
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

        return res.render('_errors/generic', { err });
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
              details: 'Juror number must be 9 characters',
              summary: 'Juror number must be 9 characters',
              summaryLink: 'jurorNumber',
            },
          ],
        };
      }

      if (req.body.pool_number.trim().length !== 0 && req.body.pool_number.trim().length !== 9) {
        validatorResult = {
          ...validatorResult,
          poolNumber: [
            {
              details: 'Pool number must be 9 characters',
              summary: 'Pool number must be 9 characters',
              summaryLink: 'poolNumber',
            },
          ],
        };
      }

      let staffToSearch = null;

      if (req.session.staffList && req.body['officer_assigned']) {

        staffToSearch = req.session.staffList
          .find((staff) => staff.name.toLowerCase() === req.body['officer_assigned'].toLowerCase());

        if (!staffToSearch && !!req.body['officer_assigned']) {
          validatorResult = {
            ...validatorResult,
            officerAssigned: [
              {
                details: 'Select a staff from the list provided',
                summary: 'Select a staff from the list provided',
                summaryLink: 'officerAssigned',
              },
            ],
          };
        }
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

      // assign the officer and then delete the list from session
      if (staffToSearch) {
        payload['officer_assigned'] = staffToSearch.login;
      }

      delete req.session.staffList;
      delete payload._csrf;

      const searchParams = _.clone(payload);

      if (staffToSearch?.name) {
        searchParams['officer_assigned'] = staffToSearch.name;
      }

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
        promiseArr.push(staffRosterObj.get(req));
        promiseArr.push(searchResponsesDAO.post(req, payload));

        const response = await Promise.all(promiseArr);

        staff = response[0];
        responses = response[1];
        staff.push({
          login: "AUTO",
          name: "AUTO"
        });
        responses.juror_response.forEach(responsesListIterator(staff));
        resultsStr = buildSearchString(payload);

        req.session.searchResponse = {
          staff,
          responses,
          searchParams,
          resultsStr,
        };

        app.logger.info('Fetched search results: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            params: req.session.searchParams,
          },
          response: _.merge(staff, responses),
        });

        // we will not move away from this controller / page... so set again the staff list for the next submission
        req.session.staffList = _.clone(staff);

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
          staffList: flattenStaffList(staff),
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

  function flattenStaffList(staffList) {
    return staffList ? staffList.reduce((list, curr) => {
      list.push(curr.name);
      return list;
    }, []).join(',') : '';
  }

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
    if (payload.processing_status) {
      for (const status of payload.processing_status) {
        str.push(`"${resolveProcessingStatus(status)}"`);
      }
    }

    return str.join(', ');
  }

  function responsesListIterator(staff) {
    return function(r) {
      r['juror_name'] = r.first_name + ' ' + r.last_name;
      r['date_received'] = dateFilter(r.date_received, null, 'YYYY-MM-DD');

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

