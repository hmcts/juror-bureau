const { poolRequestsDAO } = require('../../objects/pool-list');

(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const modUtils = require('../../lib/mod-utils');
  const validator = require('../../config/validation/messaging');
  const { trialsListDAO } = require('../../objects/create-trial');
  const { dateFilter, capitalise, convert12to24 } = require('../../components/filters');
  const { messageTemplateDAO, jurorSearchDAO, sendMessage, populatedMessageDAO } = require('../../objects/messaging');
  const { messagingCodes, messagingTitles } = require('../../lib/mod-utils');

  module.exports.getMessages = function(app) {
    return function(req, res) {
      let bannerMessage;

      delete req.session.messaging;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;

      return res.render('messaging/messages-list.njk', {
        nav: 'send',
        bannerMessage,
      });
    };
  };

  module.exports.getMessageTemplate = function(app) {
    return async function(req, res) {
      const { message } = req.params
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formField;
      delete req.session.messaging;

      req.session.messaging = {};

      // If not a pre-defined message, reroute back to message links
      if (!messagingTitles[message]) {
        return res.redirect(app.namedRoutes.build('messaging.send.get'));
      }

      try {
        let templateData = await messageTemplateDAO.get(
          req,
          messagingCodes[message],
          req.session.authentication.locCode,
        );

        templateData = modUtils.replaceAllObjKeys(templateData, _.camelCase);

        // If either of sentencing messages we need to force a trial number
        // Maybe find a way of making this generic too - if so would need a new flag from API
        if (message === 'sentencing-date' || message === 'sentencing-invite') {
          req.session.messaging.trialNoRequired = true;
        }

        req.session.messaging.sendType = templateData.sendType;

        const editablePlaceHolders = templateData.placeholders.filter((ph) => ph.editable);

        req.session.messaging.placeholders = editablePlaceHolders.map(ph => (
          {
            id: _.camelCase(ph.displayName),
            placeholderName: ph.placeholderName,
            dataType: ph.dataType,
          }
        ));

        return res.render('messaging/messages-template.njk', {
          messageTitle: messagingTitles[message],
          englishMessage: templateData.messageTemplateEnglish,
          welshMessage: templateData.messageTemplateWelsh,
          placeholders: templateData.placeholders.sort((a, b) => a.displayName.localeCompare(b.displayName)),
          editDetails: editablePlaceHolders.length,
          sendType: templateData.sendType,
          submitUrl: app.namedRoutes.build('messaging.send.template.post', { message }),
          cancelUrl: app.namedRoutes.build('messaging.send.get'),
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Unable to fetch message template', {
          auth: req.session.authentication,
          data: {
            messageType: messagingCodes[message],
            locCode: req.session.authentication.locCode,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postMessageTemplate = function(app) {
    return function(req, res) {
      const { message } = req.params;

      const validatorResult = validate(req.body, validator.messageTemplate());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('messaging.send.template.get', {
          message,
        }));
      };

      const placeholders = _.clone(req.session.messaging.placeholders);

      delete req.session.messaging.placeholders;

      if (placeholders.length) {
        req.session.messaging.placeholderValues = {};
        placeholders.forEach((ph) => {
          if (ph.dataType === 'DATE') {
            req.session.messaging.placeholderValues[ph.placeholderName] = dateFilter(
              req.body[ph.id], 'DD/MM/YYYY', 'yyyy-MM-DD'
            );
          } else if (ph.dataType === 'TIME') {
            req.session.messaging.placeholderValues[ph.placeholderName] =  modUtils.padTimeForApi(
              convert12to24(
                `${req.body[ph.id + 'Hour']}:${req.body[ph.id + 'Minute']}${req.body[ph.id + 'Period']}`
              )
            );
          }
        });
      }

      if (req.session.messaging.trialNoRequired) {
        req.session.messaging.searchBy = 'trial';
        return res.redirect(app.namedRoutes.build('messaging.send.select-trial.get', { message }));
      }

      return res.redirect(app.namedRoutes.build('messaging.send.find-jurors.get', { message }));
    };
  };

  module.exports.getFindJurors = function(app) {
    return function(req, res) {
      const { message } = req.params
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);

      if (!req.session.messaging) {
        return res.redirect(app.namedRoutes.build('messaging.send.get'));
      }

      delete req.session.errors;
      delete req.session.formField;
      delete req.session.messaging.filters;
      delete req.session.messaging.checkedJurors;
      delete req.session.messaging.activePoolSearch;

      return res.render('messaging/find-jurors.njk', {
        messageTitle: messagingTitles[message],
        submitUrl: app.namedRoutes.build('messaging.send.find-jurors.post', { message }),
        activePoolsUrl: app.namedRoutes.build('messaging.send.select-pool.get', { message }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('messaging.send.template.get', { message }),
        },
        cancelUrl: app.namedRoutes.build('messaging.send.get'),
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postFindJurors = function(app) {
    return function(req, res) {
      const { message } = req.params;
      const { searchAgain } = req.query;
      let searchOptions;

      delete req.session.errors;
      delete req.session.formFields;

      if (searchAgain) {
        delete req.session.messaging.filters;
        delete req.session.messaging.jurorsOnPage;
        delete req.session.messaging.checkedJurors;

        const validatorResult = validate(
          {...req.body, searchBy: req.session.messaging.searchBy}
          , validator.findJurors());

        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
        };

        searchOptions = {
          'jurorSearch': req.body.jurorNameSearch || req.body.jurorNumberSearch ? {
            'jurorName': req.body.jurorNameSearch ? req.body.jurorNameSearch : null,
            'jurorNumber': req.body.jurorNumberSearch ? req.body.jurorNumberSearch : null,
          } : null,
          'poolNumber': req.body.poolSearch ? req.body.poolSearch : null,
          'nextDueAtCourtDate': req.body.nextDueAtCourtDate
            ? dateFilter(req.body.nextDueAtCourtDate, 'DD/MM/YYYY', 'yyyy-MM-DD') : null,
          'dateDeferredTo': req.body.deferralDate
            ? dateFilter(req.body.deferralDate, 'DD/MM/YYYY', 'yyyy-MM-DD') : null,
          'trialNumber': null,
        };
      } else {
        const validatorResult = validate(req.body, validator.findJurors());

        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('messaging.send.find-jurors.get', { message }));
        };

        req.session.messaging.searchBy = req.body.searchBy;

        if (req.body.searchBy === 'trial') {
          return res.redirect(app.namedRoutes.build('messaging.send.select-trial.get', { message }));
        }

        searchOptions = {
          'jurorSearch': req.body.searchBy === 'jurorName' || req.body.searchBy === 'jurorNumber' ? {
            'jurorName': req.body.searchBy === 'jurorName' ? req.body.jurorNameSearch : null,
            'jurorNumber': req.body.searchBy === 'jurorNumber' ? req.body.jurorNumberSearch : null,
          } : null,
          'poolNumber': req.body.searchBy === 'pool' ? req.body.poolSearch : null,
          'nextDueAtCourtDate': req.body.searchBy === 'nextDueAtCourt'
            ? dateFilter(req.body.nextDueAtCourtDate, 'DD/MM/YYYY', 'yyyy-MM-DD') : null,
          'dateDeferredTo': req.body.searchBy === 'deferral'
            ? dateFilter(req.body.deferralDate, 'DD/MM/YYYY', 'yyyy-MM-DD') : null,
          'trialNumber': null,
        };
      }

      req.session.messaging.searchOptions = searchOptions;

      return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
    };
  };

  module.exports.getSelectTrial = function(app) {
    return async function(req, res) {
      const { message } = req.params
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);
      const currentPage = req.query['page'] || 1
        , sortBy = req.query['sortBy'] || 'trialNumber'
        , sortOrder = req.query['sortOrder'] || 'ascending'
        , trialNumber = req.query['trialNumber'];
      let pagination;
      const opts = {
        active: false,
        pageNumber: currentPage,
        pageLimit: modUtils.constants.PAGE_SIZE,
        sortField: capitalise(modUtils.camelToSnake(sortBy)),
        sortMethod: sortOrder === 'ascending' ? 'ASC' : 'DESC',
        trialNumber: trialNumber,
      };

      if (!req.session.messaging) {
        return res.redirect(buildUrl(app, message, ['messaging.send.get', 'messaging.export-contacts.get']));
      }

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.messaging.filters;
      delete req.session.messaging.jurorsOnPage;
      delete req.session.messaging.checkedJurors;
      if (req.session.messaging.placeholderValues && req.session.messaging.placeholderValues['<trial_no>']){
        delete req.session.messaging.placeholderValues['<trial_no>'];
      }

      try {
        let data = await trialsListDAO.post(req, modUtils.mapCamelToSnake(opts));

        data = modUtils.replaceAllObjKeys(data, _.camelCase);

        app.logger.info('Fetched list of all trials', {
          data: {
            trials: data,
          },
        });

        const queryTotal = data.totalItems;

        if (queryTotal > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
        }

        return res.render('messaging/select-trial.njk', {
          messageTitle: messagingTitles[message],
          filterUrl: buildUrl(app, message, [
            'messaging.send.select-trial.filter.post',
            'messaging.export-contacts.trials.filter.post',
          ]),
          clearSearchUrl: buildUrl(app, message, [
            'messaging.send.select-trial.get',
            'messaging.export-contacts.trials.get',
          ]),
          submitUrl: app.namedRoutes.build('messaging.send.select-trial.post', { message }),
          backLinkUrl: {
            built: true,
            url: buildUrl(app, message, [
              req.session.messaging.trialNoRequired ? 'messaging.send.template.get' : 'messaging.send.find-jurors.get',
              'messaging.export-contacts.get',
            ]),
          },
          tmpBody,
          trialNumber,
          pagination,
          trials: modUtils.transformRadioSelectTrialsList(data.data, sortBy, sortOrder),
          urlPrefix: trialNumber ? `?trialNumber=${encodeURIComponent(trialNumber)}` : '',
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch trials: ', {
          auth: req.session.authentication,
          data: opts,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postFilterTrial = function(app) {
    return function(req, res) {
      const { message } = req.params;
      const validatorResult = validate(req.body, validator.trialSearch());

      const url = buildUrl(app, message, [
        'messaging.send.select-trial.get',
        'messaging.export-contacts.trials.get',
      ]);

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(url);
      }

      return res.redirect(url + '?trialNumber=' + encodeURIComponent(req.body.searchTrialNumber));
    };
  };

  module.exports.postSelectTrial = function(app) {
    return function(req, res) {
      const { message } = req.params;

      if (typeof req.body.selectedTrial === 'undefined') {
        req.session.errors = {
          selectedTrial: [{
            summary: 'Select a trial',
            details: 'Select a trial',
          }],
        };
        req.session.formFields = req.body;
        return res.redirect(buildUrl(app, message, [
          'messaging.send.select-trial.get',
          'messaging.export-contacts.trials.get',
        ]));
      };

      if (message === 'export-contact-details') {
        return res.redirect(app.namedRoutes.build('messaging.export-contacts.jurors.get')
          + '?searchBy=trial&trialNumber=' + encodeURIComponent(req.body.selectedTrial));
      }

      const searchOptions = {
        'jurorSearch': null,
        'poolNumber': null,
        'nextDueAtCourtDate': null,
        'dateDeferredTo': null,
        'trialNumber': req.body.selectedTrial,
      };

      req.session.messaging.searchOptions = searchOptions;

      if (req.session.messaging.trialNoRequired) {
        req.session.messaging.placeholderValues['<trial_no>'] = req.body.selectedTrial;
      }

      return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
    };
  };

  module.exports.getSelectJurors = function(app) {
    return async function(req, res) {
      const { message } = req.params
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);
      const currentPage = req.query['page'] || 1
        , sortBy = req.query['sortBy'] || ''
        , sortOrder = req.query['sortOrder'] || ''
        , showFilter = req.query['showFilter'] || false
        , clearFilters = req.query['clearFilters'] || false;
      let pagination;

      delete req.session.errors;
      delete req.session.formFields;

      if (!req.session.messaging) {
        return res.redirect(app.namedRoutes.build('messaging.send.get'));
      }

      if (clearFilters) {
        delete req.session.messaging.filters;
        return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
      }

      let backLinkUrl = app.namedRoutes.build('messaging.send.find-jurors.get', { message });
      if (req.session.messaging.searchBy === 'trial') {
        backLinkUrl = app.namedRoutes.build('messaging.send.select-trial.get', { message });
      } else if (req.session.messaging.searchBy === 'pool' && req.session.messaging.activePoolSearch) {
        backLinkUrl = app.namedRoutes.build('messaging.send.select-pool.get', { message });
      }

      const filters = _.clone(req.session.messaging.filters) || {};
      const sendType = _.clone(req.session.messaging.sendType);
      const searchOptions = _.clone(req.session.messaging.searchOptions);

      const opts = {
        ...searchOptions,
        'filters': [...(filters.showOnly || []), ...(filters.include || [])],
        'pageNumber': currentPage,
        'pageLimit': modUtils.constants.PAGE_SIZE,
        'sortMethod': sortOrder === 'ascending' ? 'ASC' : (sortOrder === 'descending' ? 'DESC' : null),
        'sortField': capitalise(_.snakeCase(sortBy)) || null,
        'includeAllJurorsOnTrial': message === 'sentencing-date' || message === 'sentencing-invite',
      };

      try {
        let jurorsData = await jurorSearchDAO.post(
          req,
          req.session.authentication.locCode,
          opts
        );

        jurorsData = modUtils.replaceAllObjKeys(jurorsData, _.camelCase);

        app.logger.info('Fetched list of jurors', {
          auth: req.session.authentication,
          opts: opts,
        });

        const queryTotal = jurorsData.totalItems;

        if (queryTotal > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
        }

        req.session.messaging.jurorsOnPage = jurorsData.data;

        const checkedJurors = _.clone(req.session.messaging.checkedJurors);

        return res.render('messaging/select-jurors.njk', {
          message,
          messageTitle: messagingTitles[message],
          submitUrl: app.namedRoutes.build('messaging.send.select-jurors.post', { message }),
          backLinkUrl: {
            built: true,
            url: backLinkUrl,
          },
          changeSearchUrl: req.session.messaging.searchBy === 'trial'
            ? app.namedRoutes.build('messaging.send.select-trial.get', { message })
            : app.namedRoutes.build('messaging.send.find-jurors.get', { message }),
          searchUrl: app.namedRoutes.build('messaging.send.find-jurors.post', { message }) + '?searchAgain=true',
          jurors: jurorsData.data,
          checkedJurors,
          sendType,
          searchBy: req.session.messaging.searchBy,
          searchOptions,
          sortBy,
          sortOrder,
          pagination,
          totalJurors: queryTotal,
          checkableJurors: getCheckableJurors(_.clone(req.session.messaging.jurorsOnPage), sendType),
          showFilter,
          filterUrl: app.namedRoutes.build('messaging.send.select-jurors.filter.post', { message }),
          clearFiltersUrl: app.namedRoutes.build('messaging.send.select-jurors.get',
            { message }) + '?clearFilters=true',
          appliedFilters: filters,
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

          return res.render('messaging/select-jurors.njk', {
            messageTitle: messagingTitles[message],
            backLinkUrl: {
              built: true,
              url: req.session.messaging.searchBy === 'trial'
                ? app.namedRoutes.build('messaging.send.select-trial.get', { message })
                : app.namedRoutes.build('messaging.send.find-jurors.get', { message }),
            },
            changeSearchUrl: req.session.messaging.searchBy === 'trial'
              ? app.namedRoutes.build('messaging.send.select-trial.get', { message })
              : app.namedRoutes.build('messaging.send.find-jurors.get', { message }),
            searchUrl: app.namedRoutes.build('messaging.send.find-jurors.post', { message }) + '?searchAgain=true',
            totalJurors: err.error?.code === 'MAX_ITEMS_EXCEEDED' ? 'MAX_ITEMS_EXCEEDED' : 0,
            errorMetadata: err.error?.meta_data,
            searchBy: req.session.messaging.searchBy,
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

  module.exports.postSelectJurors = function(app) {
    return function(req, res) {
      const { message } = req.params;

      if (!req.session.messaging.checkedJurors || req.session.messaging.checkedJurors.length === 0) {
        req.session.errors = {
          checkedJurors: [{
            summary: 'Select at least one juror to send message to',
            details: 'Select at least one juror to send message to',
          }],
        };
        return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
      }

      delete req.session.messaging.jurorsOnPage;

      return res.redirect(app.namedRoutes.build('messaging.send.confirmation.get', { message }));
    };
  };

  module.exports.getMessageConfirmation = function(app) {
    return async function(req, res) {
      const { message } = req.params;

      delete req.session.errors;

      if (!req.session.messaging) {
        return res.redirect(app.namedRoutes.build('messaging.send.get'));
      }

      try {
        let messageData = await populatedMessageDAO.post(
          req,
          messagingCodes[message],
          req.session.authentication.locCode,
          req.session.messaging.placeholderValues || {}
        );

        messageData = modUtils.replaceAllObjKeys(messageData, _.camelCase);

        const checkedJurors = _.clone(req.session.messaging.checkedJurors);

        let englishJurors = checkedJurors.length;
        let welshJurors = 0;

        if (messageData.messageTemplateWelsh) {
          englishJurors = checkedJurors.filter(j => !j.welshLanguage).length;
          welshJurors = checkedJurors.filter(j => j.welshLanguage).length;
        }

        return res.render('messaging/message-confirmation.njk', {
          messageTitle: messagingTitles[message],
          englishJurors,
          englishMessage: messageData['messageTemplateEnglish'],
          welshJurors,
          welshMessage: messageData['messageTemplateWelsh'],
          submitUrl: app.namedRoutes.build('messaging.send.confirmation.get', { message }),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('messaging.send.select-jurors.get', { message }),
          },
          cancelUrl: app.namedRoutes.build('messaging.send.get'),
        });
      } catch (err) {
        app.logger.crit('Unable to fetch message', {
          auth: req.session.authentication,
          data: {
            messageType: messagingCodes[message],
            locCode: req.session.authentication.locCode,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postMessageConfirmation = function(app) {
    return async function(req, res) {
      const { message } = req.params;

      delete req.session.errors;

      try {
        let checkedJurors = _.clone(req.session.messaging.checkedJurors);

        checkedJurors.forEach(j => {
          j.type = j.selectedMethod === 'email' ? 'EMAIL' : 'SMS';
          delete j.selectedMethod;
          delete j.welshLanguage;
        });

        const payload = {
          'jurors': checkedJurors,
          'placeholderValues': _.clone(req.session.messaging.placeholderValues) || {},
        };

        await sendMessage.post(
          req,
          messagingCodes[message],
          req.session.authentication.locCode,
          payload,
        );

        delete req.session.messaging;

        req.session.bannerMessage = `Message will be sent to ${checkedJurors.length} jurors`;

        res.redirect(app.namedRoutes.build('messaging.send.get'));
      } catch (err) {
        app.logger.crit('Unable to send messages', {
          auth: req.session.authentication,
          data: {},
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postFilterJurors = function(app) {
    return function(req, res) {
      const { message } = req.params;

      if (req.body.include || req.body.showOnly) {
        req.session.messaging.filters = {
          include: !Array.isArray(req.body.include) && typeof req.body.include !== 'undefined'
            ? [req.body.include] : req.body.include,
          showOnly: !Array.isArray(req.body.showOnly) && typeof req.body.showOnly !== 'undefined'
            ? [req.body.showOnly] : req.body.showOnly,
        };
      } else {
        delete req.session.messaging.filters;
      }

      if (req.session.messaging.checkedJurors) {
        req.session.messaging.checkedJurors = [];
      }

      return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
    };
  };

  module.exports.postCheckJuror = function(app) {
    return async function(req, res) {
      const { message } = req.params;
      const { jurorNumber, action } = req.query;

      if (!req.session.messaging.checkedJurors) {
        req.session.messaging.checkedJurors = [];
      }

      if (jurorNumber === 'check-all-jurors') {
        if (action === 'check') {
          // GET ALL POSSIBLE JURORS FOR SEARCH CRITERIA AND CHECK THEM
          try {
            const filters = _.clone(req.session.messaging.filters) || {};
            const searchOptions = _.clone(req.session.messaging.searchOptions);
            const opts = {
              ...searchOptions,
              'filters': [...(filters.showOnly || []), ...(filters.include || [])],
              'pageNumber': '1',
              // 500 is the max results we will every show
              // May need to split this down into seperate calls dependant on performance
              'pageLimit': '500',
              'includeAllJurorsOnTrial': message === 'sentencing-date',
            };

            let jurorsData = await jurorSearchDAO.post(
              req,
              req.session.authentication.locCode,
              opts,
              true
            );

            jurorsData = modUtils.replaceAllObjKeys(jurorsData, _.camelCase);

            // Removing null values from juror objects
            let jurors = [];

            jurorsData.data.forEach(j => {
              jurors.push(_.omitBy(j, _.isNil));
            });

            app.logger.info('Fetched list of jurors', {
              auth: req.session.authentication,
              opts: opts,
            });

            const checkableJurors = getCheckableJurors(jurors, req.session.messaging.sendType);
            const checkedJurors = jurors.filter(j => checkableJurors.includes(j.jurorNumber));

            req.session.messaging.checkedJurors = checkedJurors.map((juror) => {
              const jOnPage = req.session.messaging.jurorsOnPage.find(j => j.jurorNumber === juror.jurorNumber) || {};

              return {
                ...juror,
                selectedMethod: jOnPage.selectedMethod
                  ||  getDefaultMessageMethod(juror, req.session.messaging.sendType),
              };
            });

          } catch (err) {
            app.logger.crit('Failed to fetch list of jurors: ', {
              auth: req.session.authentication,
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            return res.render('_errors/generic', { err });
          }

        } else if (action === 'uncheck') {
          delete req.session.messaging.checkedJurors;
        }
      } else {
        // If already checked -> uncheck
        // eslint-disable-next-line no-lonely-if
        if (action === 'uncheck') {
          req.session.messaging.checkedJurors = req.session.messaging.checkedJurors.filter((j) => {
            return j.jurorNumber !== jurorNumber;
          });
        } else {
          const juror = req.session.messaging.jurorsOnPage.find(j => j.jurorNumber === jurorNumber);

          req.session.messaging.checkedJurors.push({
            'jurorNumber': juror['jurorNumber'],
            'poolNumber': juror['poolNumber'],
            'welshLanguage': juror['welshLanguage'],
            selectedMethod: juror.selectedMethod || getDefaultMessageMethod(juror, req.session.messaging.sendType),
          });
        }
      }

      app.logger.info('Checked or unchecked one or more jurors: ', {
        auth: req.session.authentication,
        data: {
          jurorNumber,
        },
      });

      const noChecked = req.session.messaging.checkedJurors ? req.session.messaging.checkedJurors.length : 0;

      return res.status(200).send(noChecked.toString());
    };
  };

  module.exports.postChangeMethod = function(app) {
    return function(req, res) {
      const { jurorNumber, selection } = req.query;

      const juror = req.session.messaging.jurorsOnPage.find(j => j.jurorNumber === jurorNumber);

      juror.selectedMethod = selection;

      if (req.session.messaging.checkedJurors) {
        const checkedJuror = req.session.messaging.checkedJurors.find(j => j.jurorNumber === jurorNumber);

        if (checkedJuror) {
          checkedJuror.selectedMethod = selection;
        }
      }

      app.logger.info('Changed notification method for juror', {
        auth: req.session.authentication,
        data: {
          jurorNumber,
          selection,
        },
      });

      return res.send();
    };
  };

  module.exports.getSelectPool = function(app) {
    return async function(req, res) {
      const { message } = req.params
        , tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);
      const currentPage = req.query['page'] || 1
        , sortBy = req.query['sortBy'] || 'serviceStartDate'
        , sortOrder = req.query['sortOrder'] || 'ascending';
      let pagination;

      if (!req.session.messaging) {
        return res.redirect(buildUrl(app, message, ['messaging.send.get', 'messaging.export-contacts.get']));
      }

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.messaging.filters;
      delete req.session.messaging.jurorsOnPage;
      delete req.session.messaging.checkedJurors;

      try {
        const data = await poolRequestsDAO.get(req, {
          status: 'created',
          tab: 'court',
          page: currentPage,
          locCode: req.session.authentication.locCode,
          sortBy,
          sortOrder,
        });

        app.logger.info('Fetched list of active pools', {
          auth: req.session.authentication,
          data: {
            pools: data,
          },
        });

        modUtils.replaceAllObjKeys(data, _.camelCase);

        const queryTotal = data.totalItems;

        if (queryTotal > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
        }

        const pools = modUtils.transformPoolList(data.data, 'created', 'court', sortBy, sortOrder, true);

        return res.render('messaging/select-pool.njk', {
          messageTitle: messagingTitles[message],
          submitUrl: app.namedRoutes.build('messaging.send.select-pool.post', { message }),
          backLinkUrl: {
            built: true,
            url: buildUrl(app, message, [
              'messaging.send.find-jurors.get',
              'messaging.export-contacts.get',
            ]),
          },
          tmpBody,
          pagination,
          pools,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch pools: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postSelectPool = function(app) {
    return function(req, res) {
      const { message } = req.params;

      if (typeof req.body.selectedPool === 'undefined') {
        req.session.errors = {
          selectedTrial: [{
            summary: 'Select a pool',
            details: 'Select a pool',
          }],
        };
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('messaging.send.select-pool.get', { message }));
      };


      const searchOptions = {
        'jurorSearch': null,
        'poolNumber': req.body.selectedPool,
        'nextDueAtCourtDate': null,
        'dateDeferredTo': null,
        'trialNumber': null,
      };

      req.session.messaging.searchOptions = searchOptions;
      req.session.messaging.searchBy = 'pool';
      req.session.messaging.activePoolSearch = true;

      return res.redirect(app.namedRoutes.build('messaging.send.select-jurors.get', { message }));
    };
  };

  function getCheckableJurors(jurors, sendType) {
    const checkableJurors = [];

    jurors.forEach((j) => {
      switch (sendType) {
      case 'EMAIL_AND_SMS':
        if (j.email || j.phone) {
          checkableJurors.push(j.jurorNumber);
        }
        break;
      case 'EMAIL' :
        if (j.email) {
          checkableJurors.push(j.jurorNumber);
        }
        break;
      case 'SMS' :
        if (j.phone) {
          checkableJurors.push(j.jurorNumber);
        }
        break;
      }
    });

    return checkableJurors;
  }

  function getDefaultMessageMethod(j, sendType) {
    switch (sendType){
    case 'EMAIL':
      return 'email';
    case 'SMS':
      return 'text';
    case 'EMAIL_AND_SMS':
      if (!j.email && j.phone) {
        return 'text';
      } else if (j.email && !j.phone) {
        return 'email';
      }
      return 'email';
    }
  }

  function buildUrl(app, message, [url1, url2]) {
    if (message === 'export-contact-details') {
      return app.namedRoutes.build(url2, { message });
    }
    return app.namedRoutes.build(url1, { message });
  }

})();
