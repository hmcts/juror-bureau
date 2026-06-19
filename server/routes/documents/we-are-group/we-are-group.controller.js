(function () {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const validator = require('../../../config/validation/we-are-group-contact');
  const { jurorSearchDAO, sendMessage } = require('../../../objects/messaging');
  const { capitalise } = require('../../../components/filters');
  const modUtils = require('../../../lib/mod-utils');

  const PAGE_SIZE = 500;
  const TEST_JUROR_NUMBER = '999999999';
  const TEST_JUROR = {
    jurorNumber: TEST_JUROR_NUMBER,
    poolNumber: '415230101',
    firstName: 'Jane',
    lastName: 'Summons',
    status: 'Responded',
    email: 'jane.summons@example.com',
    phone: '07123456789',
    locCode: '400',
    isTestJuror: true,
  };
  const INCLUDE_ALL_BUREAU_STATUSES = [
    'INCLUDE_DEFERRED',
    'INCLUDE_DISQUALIFIED_AND_EXCUSED',
  ];

  module.exports.getSearch = function (app, message) {
    return function (req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const formFields = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.weAreGroup;

      return res.render('documents/we-are-group/search.njk', {
        messageTitle: message.title,
        postUrl: buildRoute(app, message, 'post'),
        backLinkUrl: app.namedRoutes.build('documents.get'),
        formFields,
        errors: errorPayload(tmpErrors),
      });
    };
  };

  module.exports.postSearch = function (app, message) {
    return async function (req, res) {
      const validatorResult = validate(req.body, validator.searchJurors(req.body));

      delete req.session.errors;
      delete req.session.formFields;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(buildRoute(app, message, 'get'));
      }

      const payload = buildSearchPayload(req.body);

      if (isTestJurorSearch(req.body)) {
        req.session.weAreGroup = {
          messageKey: message.key,
          jurors: [TEST_JUROR],
          search: {
            searchBy: req.body.searchBy,
            jurorNumber: req.body.jurorNumber,
          },
        };

        return res.redirect(buildRoute(app, message, 'results.get'));
      }

      try {
        let jurorsData = await jurorSearchDAO.post(req, getLocationCode(req), payload, true);
        let jurors = modUtils.replaceAllObjKeys(jurorsData.data || [], _.camelCase);

        if (req.body.searchBy === 'jurorName') {
          jurors = filterExactNameMatches(jurors, req.body.firstName, req.body.lastName);
        }

        if (!jurors.length) {
          req.session.errors = buildNoMatchError(req.body.searchBy);
          req.session.formFields = req.body;

          return res.redirect(buildRoute(app, message, 'get'));
        }

        req.session.weAreGroup = {
          messageKey: message.key,
          jurors,
          search: {
            searchBy: req.body.searchBy,
            jurorNumber: req.body.jurorNumber,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
          },
        };

        app.logger.info(`Fetched jurors for ${message.logName} message`, {
          auth: req.session.authentication,
          data: payload,
        });

        return res.redirect(buildRoute(app, message, 'results.get'));
      } catch (err) {
        if (err.statusCode === 404) {
          req.session.errors = buildNoMatchError(req.body.searchBy);
          req.session.formFields = req.body;

          return res.redirect(buildRoute(app, message, 'get'));
        }

        app.logger.crit(`Failed to search jurors for ${message.logName} message`, {
          auth: req.session.authentication,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.getResults = function (app, message) {
    return function (req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const flow = getFlow(req, message);

      delete req.session.errors;

      if (!flow?.jurors) {
        return res.redirect(buildRoute(app, message, 'get'));
      }

      return res.render('documents/we-are-group/results.njk', {
        messageTitle: message.title,
        jurors: flow.jurors,
        postUrl: buildRoute(app, message, 'results.post'),
        searchAgainUrl: buildRoute(app, message, 'get'),
        backLinkUrl: buildRoute(app, message, 'get'),
        errors: errorPayload(tmpErrors),
      });
    };
  };

  module.exports.postResults = function (app, message) {
    return function (req, res) {
      const selectedJurorNumber = req.body.selectedJuror;
      const flow = getFlow(req, message);

      delete req.session.errors;

      if (!selectedJurorNumber) {
        req.session.errors = {
          selectedJuror: [{
            details: 'Select a juror',
            summary: 'Select a juror',
          }],
        };

        return res.redirect(buildRoute(app, message, 'results.get'));
      }

      const selectedJuror = flow?.jurors
        ?.find(juror => juror.jurorNumber === selectedJurorNumber);

      if (!selectedJuror) {
        return res.redirect(buildRoute(app, message, 'get'));
      }

      if (!selectedJuror.email) {
        req.session.errors = {
          selectedJuror: [{
            details: 'Juror must have an email address to send this message',
            summary: 'Juror must have an email address to send this message',
          }],
        };

        return res.redirect(buildRoute(app, message, 'results.get'));
      }

      flow.selectedJuror = selectedJuror;

      return res.redirect(buildRoute(app, message, 'preview.get'));
    };
  };

  module.exports.getPreview = function (app, message) {
    return function (req, res) {
      const selectedJuror = getFlow(req, message)?.selectedJuror;

      if (!selectedJuror) {
        return res.redirect(buildRoute(app, message, 'results.get'));
      }

      return res.render('documents/we-are-group/preview.njk', {
        messageTitle: message.title,
        messageContentTemplate: message.contentTemplate,
        juror: selectedJuror,
        postUrl: buildRoute(app, message, 'preview.post'),
        cancelUrl: app.namedRoutes.build('documents.get'),
        backLinkUrl: buildRoute(app, message, 'results.get'),
      });
    };
  };

  module.exports.postPreview = function (app, message) {
    return async function (req, res) {
      const selectedJuror = getFlow(req, message)?.selectedJuror;

      if (!selectedJuror) {
        return res.redirect(buildRoute(app, message, 'get'));
      }

      const payload = {
        jurors: [{
          jurorNumber: selectedJuror.jurorNumber,
          poolNumber: selectedJuror.poolNumber,
          type: 'EMAIL',
        }],
        placeholderValues: {},
      };

      try {
        if (selectedJuror.isTestJuror) {
          req.session.documentsJurorsList = {
            successMessage: `The message has been sent to ${selectedJuror.email} using GOV.UK Notify.`,
          };

          delete req.session.weAreGroup;

          return res.redirect(app.namedRoutes.build('documents.get'));
        }

        await sendMessage.post(req, message.code, getLocationCode(req), payload);

        req.session.documentsJurorsList = {
          successMessage: `The message has been sent to ${selectedJuror.email} using GOV.UK Notify.`,
        };

        delete req.session.weAreGroup;

        app.logger.info(`Sent ${message.logName} message`, {
          auth: req.session.authentication,
          data: {
            jurorNumber: selectedJuror.jurorNumber,
            poolNumber: selectedJuror.poolNumber,
          },
        });

        return res.redirect(app.namedRoutes.build('documents.get'));
      } catch (err) {
        app.logger.crit(`Failed to send ${message.logName} message`, {
          auth: req.session.authentication,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  function buildSearchPayload (body) {
    const payload = {
      pageNumber: 1,
      pageLimit: PAGE_SIZE,
      filters: INCLUDE_ALL_BUREAU_STATUSES,
      sortMethod: 'ASC',
      sortField: capitalise(_.snakeCase('jurorNumber')),
    };

    if (body.searchBy === 'jurorNumber') {
      payload.jurorSearch = {
        jurorNumber: body.jurorNumber,
      };
    }

    if (body.searchBy === 'jurorName') {
      payload.jurorSearch = {
        jurorName: `${body.firstName} ${body.lastName}`,
      };
    }

    return payload;
  }

  function buildNoMatchError (searchBy) {
    if (searchBy === 'jurorNumber') {
      return {
        jurorNumber: [{
          details: 'Enter a valid juror number',
          summary: 'Enter a valid juror number',
        }],
      };
    }

    return {
      firstName: [{
        details: 'There is not an exact match in the system',
        summary: 'There is not an exact match in the system',
        summaryLink: 'firstName',
      }],
    };
  }

  function errorPayload (errors) {
    return {
      title: 'There is a problem',
      message: '',
      count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
      items: errors,
    };
  }

  function filterExactNameMatches (jurors, firstName, lastName) {
    const normalisedFirstName = normaliseName(firstName);
    const normalisedLastName = normaliseName(lastName);

    return jurors.filter(juror => normaliseName(juror.firstName) === normalisedFirstName
      && normaliseName(juror.lastName) === normalisedLastName);
  }

  function getLocationCode (req) {
    return req.session.authentication.locCode || req.session.authentication.owner;
  }

  function getFlow (req, message) {
    const flow = req.session.weAreGroup;

    return flow?.messageKey === message.key ? flow : null;
  }

  function buildRoute (app, message, route) {
    return app.namedRoutes.build(`${message.routeName}.${route}`);
  }

  function isTestJurorSearch (body) {
    return body.searchBy === 'jurorNumber' && body.jurorNumber === TEST_JUROR_NUMBER;
  }

  function normaliseName (name) {
    return (name || '').trim().toLowerCase();
  }

})();
