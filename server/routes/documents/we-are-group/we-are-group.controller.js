(function () {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const validator = require('../../../config/validation/messaging');
  const { jurorSearchDAO, sendBureauMessage } = require('../../../objects/messaging');
  const jurorRecordObject = require('../../../objects/juror-record');
  const { capitalise } = require('../../../components/filters');
  const modUtils = require('../../../lib/mod-utils');

  module.exports.getSearch = function (app, message) {
    return function (req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.weAreGroup;

      return res.render('messaging/find-jurors.njk', {
        messageTitle: message.title,
        bureauMessageSearch: true,
        submitUrl: app.namedRoutes.build(`${message.routeName}.post`),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('documents.get'),
        },
        cancelUrl: app.namedRoutes.build('documents.get'),
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postSearch = function(app, message) {
    return function(req, res) {
      let searchOptions;

      delete req.session.errors;
      delete req.session.formFields;

      const validatorResult = validate(req.body, validator.findJurors());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`${message.routeName}.get`));
      };

      req.session.weAreGroup = req.session.weAreGroup || {};
      req.session.weAreGroup.searchBy = req.body.searchBy;

      searchOptions = {
        'jurorSearch': req.body.searchBy === 'jurorName' || req.body.searchBy === 'jurorNumber' ? {
          'jurorName': req.body.searchBy === 'jurorName' ? req.body.jurorNameSearch : null,
          'jurorNumber': req.body.searchBy === 'jurorNumber' ? req.body.jurorNumberSearch : null,
        } : null,
      };

      req.session.weAreGroup.searchOptions = searchOptions;

      return res.redirect(app.namedRoutes.build(`${message.routeName}.results.get`));
    };
  };

  module.exports.getResults = function (app, message) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);
      const currentPage = req.query['page'] || 1
      const sortBy = req.query['sortBy'] || ''
      const sortOrder = req.query['sortOrder'] || ''
      let pagination;

      delete req.session.errors;
      delete req.session.formFields;

      if (!req.session.weAreGroup) {
        return res.redirect(app.namedRoutes.build('messaging.send.get'));
      }

      const backLinkUrl = app.namedRoutes.build(`${message.routeName}.get`);

      const searchOptions = _.clone(req.session.weAreGroup.searchOptions);

      const opts = {
        ...searchOptions,
        pageNumber: currentPage,
        pageLimit: modUtils.constants.PAGE_SIZE,
        sortMethod: sortOrder === 'ascending' ? 'ASC' : (sortOrder === 'descending' ? 'DESC' : null),
        sortField: capitalise(_.snakeCase(sortBy)) || null,
      };

      try {
        let jurorsData = await jurorSearchDAO.post(
          req,
          '400',
          opts
        );

        app.logger.info('Fetched list of jurors', {
          auth: req.session.authentication,
          opts: opts,
        });

        const queryTotal = jurorsData.totalItems;

        if (queryTotal > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
        }

        return res.render('documents/we-are-group/results.njk', {
          message,
          messageTitle: message.title,
          submitUrl: app.namedRoutes.build(`${message.routeName}.results.post`),
          backLinkUrl: {
            built: true,
            url: backLinkUrl,
          },
          jurors: jurorsData.data,
          searchBy: req.session.weAreGroup.searchBy,
          searchOptions,
          sortBy,
          sortOrder,
          pagination,
          totalJurors: queryTotal,
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        // No jurors found or over 500 jurors found
        if (err.statusCode === 404 || err.statusCode === 422) {
          app.logger.info('Fetched list of jurors', {
            auth: req.session.authentication,
            opts: opts,
          });

          return res.render('documents/we-are-group/results.njk', {
            messageTitle: message.title,
            backLinkUrl: {
              built: true,
              url: backLinkUrl,
            },
            totalJurors: err.error?.code === 'MAX_ITEMS_EXCEEDED' ? 'MAX_ITEMS_EXCEEDED' : 0,
            errorMetadata: err.error?.meta_data,
            searchBy: req.session.weAreGroup.searchBy,
            searchOptions,
            tmpBody,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

        app.logger.crit('Failed to fetch list of jurors: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postResults = function (app, message) {
    return function (req, res) {
      const { selectedJuror } = req.body;

      delete req.session.errors;

      if (!selectedJuror) {
        req.session.errors = {
          selectedJuror: [{
            details: 'Select a juror',
            summary: 'Select a juror',
          }],
        };

        return res.redirect(app.namedRoutes.build(`${message.routeName}.results.get`));
      }

      const [locCode, jurorNumber] = selectedJuror.split('-');

      return res.redirect(app.namedRoutes.build(`${message.routeName}.preview.get`, { locCode, jurorNumber }));
    };
  };

  module.exports.getPreview = function (app, message) {
    return async function (req, res) {
      const { locCode, jurorNumber } = req.params;

      let jurorDetails;
      try {
        jurorDetails = await jurorRecordObject.record.get(
          req,
          'detail',
          jurorNumber,
          locCode,
        );
      } catch (err) {
        app.logger.crit('Failed to fetch juror details when previewing bureau message: ', {
          auth: req.session.authentication,
          jurorNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

      if (!jurorDetails?.data?.emailAddress || jurorDetails?.data?.emailAddress === '') {
        req.session.errors = {
          emailAddress: [{
            details: 'Selected juror must have an email address',
            summary: 'Selected juror must have an email address',
          }],
        };

        return res.redirect(app.namedRoutes.build(`${message.routeName}.results.get`));
      }

      return res.render('documents/we-are-group/preview.njk', {
        messageTitle: message.title,
        messageContent: message.messageContent,
        jurorNumber,
        locCode,
        juror: jurorDetails.data,
        postUrl: app.namedRoutes.build(`${message.routeName}.preview.post`, { locCode, jurorNumber }),
        cancelUrl: app.namedRoutes.build('documents.get'),
        backLinkUrl: app.namedRoutes.build(`${message.routeName}.results.get`),
      });
    };
  };

  module.exports.postPreview = function (app, message) {
    return async function (req, res) {
      const { locCode, jurorNumber } = req.params;

      if (!locCode || !jurorNumber) {
        return res.redirect(app.namedRoutes.build(`${message.routeName}.get`));
      }

      return res.redirect(app.namedRoutes.build(`${message.routeName}.confirm.get`, { locCode, jurorNumber }));
    };
  };

  module.exports.getConfirm = function (app, message) {
    return async function (req, res) {
      const { locCode, jurorNumber } = req.params;
      
      const tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;

      let jurorDetails;
      try {
        jurorDetails = await jurorRecordObject.record.get(
          req,
          'detail',
          jurorNumber,
          locCode,
        );
      } catch (err) {
        app.logger.crit('Failed to fetch juror details when sending bureau message: ', {
          auth: req.session.authentication,
          jurorNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

      return res.render('documents/we-are-group/confirm.njk', {
        messageTitle: message.title,
        messageContent: message.messageContent,
        jurorNumber,
        locCode,
        juror: jurorDetails.data,
        postUrl: app.namedRoutes.build(`${message.routeName}.confirm.post`, { locCode, jurorNumber }),
        cancelUrl: app.namedRoutes.build('documents.get'),
        backLinkUrl: app.namedRoutes.build(`${message.routeName}.preview.get`, { locCode, jurorNumber }),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postConfirm = function (app, message) {
    return async function (req, res) {
      const { locCode, jurorNumber } = req.params;
      const { email } = req.body;

      if (!locCode || !jurorNumber) {
        return res.redirect(app.namedRoutes.build(`${message.routeName}.get`));
      }

      if (!email) {
        req.session.errors = {
          emailAddress: [{
            details: 'Email address is required',
            summary: 'Email address is required',
          }],
        };

        return res.redirect(app.namedRoutes.build(`${message.routeName}.confirm.get`, { locCode, jurorNumber }));
      }

      const payload = {
        jurorEmails: [
          { 
            jurorNumber,
            email,
            emailTemplateName: message.code,
          }
        ],
      };

      try {
        const response = await sendBureauMessage.post(req, payload);

        if (response.failedNotifications && response.failedNotifications.length > 0) {
          app.logger.crit('Failed to send bureau message: ', {
            auth: req.session.authentication,
            payload,
            response,
          });

          req.session.errors = {
            emailAddress: [{
              details: 'Failed to send message to juror',
              summary: 'Failed to send message to juror',
            }],
          };

          return res.redirect(app.namedRoutes.build(`${message.routeName}.confirm.get`, { locCode, jurorNumber }));
        }

        app.logger.info('Successfully sent bureau message', {
          auth: req.session.authentication,
          payload,
          response,
        });

        req.session.bannerMessage =
          `The message has been sent to <a href="${app.namedRoutes.build('juror-record.overview.get', { jurorNumber })}" class="govuk-link">${jurorNumber}</a> using GOV.UK Notify.`;

        return res.redirect(app.namedRoutes.build('documents.get'));
      } catch (err) {
        app.logger.crit('Failed to send bureau message: ', {
          auth: req.session.authentication,
          payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic', { err });
      }
    };
  };

})();
