(function() {
  'use strict';

  const _ = require('lodash')
    , modUtils = require('../../lib/mod-utils')
    , validate = require('validate.js')
    , { panelListDAO } = require('../../objects/panel')
    , { trialsListObject, trialDetailsObject } = require('../../objects/create-trial')
    , { endTrialObject } = require('../../objects/end-trial')
    , { dateFilter, capitalizeFully, makeDate } = require('../../components/filters')
    , endTrialDateValidator = require('../../config/validation/end-trial')
    , moment = require('moment');


  module.exports.getTrials = function(app) {
    return function(req, res) {
      const currentPage = req.query['page'] || 1
        , isActive = req.query['isActive'] || 'true'
        , sortBy = req.query['sortBy'] || 'trialStartDate'
        , sortOrder = req.query['sortOrder'] || 'ascending';
      let pagination;
      const opts = {
        isActive: isActive,
        pageNumber: currentPage,
        sortBy: sortBy,
        sortOrder: sortOrder === 'ascending' ? 'asc' : 'desc',
      };

      delete req.session.continueToEndTrial;

      trialsListObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
        opts
      )
        .then((data) => {

          app.logger.info('Fetched trials list', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              isActive: isActive,
              trials: data,
            },
          });

          const queryTotal = data.totalElements;

          if (queryTotal > modUtils.constants.PAGE_SIZE) {
            pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
          }

          return res.render('trial-management/trials.njk', {
            nav: 'trials',
            isActive,
            trials: transformTrialsList(data.content, sortBy, sortOrder),
            pagination,
          });

        })
        .catch((err) => {
          app.logger.crit('Failed to fetch trials: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: opts,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });

    };
  };

  module.exports.getTrialDetail = function(app) {
    return function(req, res) {
      let tmpErrors
        , tmpFields
        , successBanner;

      const trialNumber = req.params.trialNumber
        , locationCode = req.params.locationCode;

      tmpErrors = _.clone(req.session.errors);
      tmpFields = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.trial;
      delete req.session.continueToEndTrial;

      // Clear returns flow
      delete req.session.panel;
      delete req.session.handleAttendance;
      delete req.session.checkInTime;
      delete req.session.checkOutTime;
      delete req.session.isJuryEmpanelled;

      Promise.all([trialDetailsObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
        trialNumber,
        locationCode
      ), panelListDAO.get(
        app, req, req.params.trialNumber, req.params.locationCode
      ).catch(err => {
        app.logger.crit('Unable to fetch panel details, continuing to trial details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return {};
      })])
        .then(([trialData, panelData]) => {

          if (typeof tmpFields === 'undefined') {
            req.session.originalTrialNumber = trialData.trialNumber;
            tmpFields = _.clone(trialData);
            tmpFields.defendants = trialData.trial_type === 'criminal' ? trialData.defendants : '';
            tmpFields.respondents = trialData.trial_type === 'civil' ? trialData.defendants : '';
          }

          if (req.session.bannerMessage) {
            successBanner = req.session.bannerMessage;
            delete req.session.bannerMessage;
          }

          if (panelData) {
            trialData.panelledJurors = panelData;
            req.session.panelData = panelData;
          }

          req.session.isJuryEmpanelled = trialData['is_jury_empanelled'];

          return res.render('trial-management/trial-detail.njk', {
            trial: trialData,
            locationCode,
            successBanner,
            formActions: {
              returnUrl: app.namedRoutes.build('trial-management.trials.return.post',
                {
                  trialNumber: req.params.trialNumber,
                  locationCode: req.params.locationCode,
                }),
            },
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });

        })
        .catch((err) => {
          app.logger.crit('Failed to fetch trial details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              trialNumber,
              locationCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('trial-management.trials.get'));
        });
    };
  };

  module.exports.getEndTrial = function(app) {
    return async function(req, res) {
      let tmpErrors
        , tmpFields
        , radioToggle = typeof req.session.formFields !== 'undefined' &&
        typeof req.session.formFields.endTrial !== 'undefined';

      tmpErrors = _.clone(req.session.errors);
      tmpFields = _.clone(req.session.formFields);

      if (typeof req.session.formFields === 'undefined') {
        tmpFields = {
          endTrialDate: moment(new Date()).format('DD/MM/YYYY'),
        };
      };

      delete req.session.errors;
      delete req.session.formFields;

      try {
        let panelData = await panelListDAO.get(
          app, req, req.params.trialNumber, req.params.locationCode
        );

        if (panelData.length > 0 && typeof req.session.continueToEndTrial === 'undefined') {
          return res.render('trial-management/end-trial/cannot-end-trial.njk', {
            isJuryEmpanelled: req.session.isJuryEmpanelled,
            cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
              trialNumber: req.params.trialNumber,
              locationCode: req.params.locationCode,
            }),
          });
        } else if (panelData.length > 0 && req.session.continueToEndTrial) {
          return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }));
        };
        return res.render('trial-management/end-trial/end-trial.njk', {
          processUrl: app.namedRoutes.build('trial-management.trials.end-trial.post', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }),
          trialNumber: req.params.trialNumber,
          tmpFields,
          radioToggle,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch trial details: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.postEndTrial = function(app) {
    return async function(req, res) {
      const validateEndTrialDate = validate(req.body, endTrialDateValidator());

      if (typeof validateEndTrialDate !== 'undefined') {
        req.session.errors = validateEndTrialDate;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('trial-management.trials.end-trial.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }));
      }

      try {
        if (req.body.endTrial === 'true') {

          let payload = {
            'trial_end_date': dateFilter(req.body.endTrialDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
            'trial_number': req.params.trialNumber,
            'location_code': req.params.locationCode,
          };

          await endTrialObject.patch(
            require('request-promise')
            , app
            , req.session.authToken
            , payload);

          req.session.bannerMessage = typeof req.session.bannerMessage !== 'undefined' ?
            req.session.bannerMessage + ' and trial ended' : 'Trial ended';
        };

        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }));
      } catch (err) {
        app.logger.crit('Failed to end trial: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  function transformTrialsList(trials, sortBy, sortOrder) {
    const table = {
        head: [],
        rows: [],
      }
      , order = sortOrder || 'ascending';

    table.head.push(
      {
        id: 'trialNumber',
        value: 'Case number',
        sort: sortBy === 'trialNumber' ? order : 'none',
      },
      {
        id: 'description',
        value: 'Names',
        sort: sortBy === 'description' ? order : 'none',
      },
      {
        id: 'trialType',
        value: 'Trial type',
        sort: sortBy === 'trialType' ? order : 'none',
      },
      {
        id: 'courtLocation',
        value: 'Court',
        sort: sortBy === 'courtLocation' ? order : 'none',
      },
      {
        id: 'courtroom',
        value: 'Courtroom',
        sort: sortBy === 'courtroom' ? order : 'none',
      },
      {
        id: 'judge',
        value: 'Judge',
        sort: sortBy === 'judge' ? order : 'none',
      },
      {
        id: 'trialStartDate',
        value: 'Start date',
        sort: sortBy === 'trialStartDate' ? order : 'none',
      },
    );

    trials.forEach(function(trial) {
      let item = [];

      item.push(
        {
          html: '<a href="/trial-management/trials/' +
              trial.trial_number + '/' +
              trial.court_location + '/detail" class="govuk-link">' + trial.trial_number + '</a>',
          attributes: {
            'data-sort-value': trial.trial_number,
          },
        },
        {
          text: trial.parties,
          attributes: {
            'data-sort-value': trial.parties,
          },
        },
        {
          text: capitalizeFully(trial.trial_type),
          attributes: {
            'data-sort-value': trial.trial_type,
          },
        },
        {
          text: capitalizeFully(trial.court),
          attributes: {
            'data-sort-value': trial.court,
          },
        },
        {
          text: capitalizeFully(trial.courtroom),
          attributes: {
            'data-sort-value': trial.courtroom,
          },
        },
        {
          text: capitalizeFully(trial.judge),
          attributes: {
            'data-sort-value': trial.judge,
          },
        },
        {
          text: dateFilter(makeDate(trial.start_date), 'YYYY,MM,DD', 'ddd DD MMM YYYY'),
          attributes: {
            'data-sort-value': makeDate(trial.start_date),
          },
        },
      );

      table.rows.push(item);
    });

    return table;
  };

})();
