(function() {
  'use strict';

  const _ = require('lodash');
  const modUtils = require('../../lib/mod-utils');
  const validate = require('validate.js');
  const { panelListDAO, panelMemberStatusDAO} = require('../../objects/panel');
  const { trialDetailsObject, trialsListDAO } = require('../../objects/create-trial');
  const { endTrialObject } = require('../../objects/end-trial');
  const { dateFilter, capitalizeFully, makeDate, capitalise } = require('../../components/filters');
  const endTrialDateValidator = require('../../config/validation/end-trial');
  const moment = require('moment');
  const messagingValidator = require('../../config/validation/messaging');


  module.exports.getTrials = function(app) {
    return function(req, res) {
      const currentPage = req.query['page'] || 1
      const isActive = req.query['isActive'] || 'true'
      const sortBy = req.query['sortBy'] || 'startDate'
      const sortOrder = req.query['sortOrder'] || 'ascending';
      const trialNumber = req.query['trialNumber'];
      let pagination;

      const tmpBody = _.clone(req.session.formFields);
      delete req.session.formFields;
      const tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;

      const opts = {
        active: isActive,
        pageNumber: currentPage,
        pageLimit: modUtils.constants.PAGE_SIZE,
        sortField: capitalise(modUtils.camelToSnake(sortBy)),
        sortMethod: sortOrder === 'ascending' ? 'ASC' : 'DESC',
        trialNumber,
      };

      trialsListDAO.post(req, modUtils.mapCamelToSnake(opts))
        .then((data) => {

          app.logger.info('Fetched trials list', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              isActive: isActive,
              trials: data,
            },
          });

          const queryTotal = data.total_items;

          if (queryTotal > modUtils.constants.PAGE_SIZE) {
            pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
          }

          if (queryTotal === 1 && trialNumber) {
            if (data.data[0].trial_number === trialNumber) {
              return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
                trialNumber: data.data[0].trial_number,
                locationCode: data.data[0].court_location,
              }));
            }
          }

          return res.render('trial-management/trials.njk', {
            nav: 'trials',
            isActive,
            trials: transformTrialsList(data.data, sortBy, sortOrder),
            pagination,
            searchUrl: app.namedRoutes.build('trial-management.trials.filter.post') + `?isActive=${isActive}`,
            clearSearchUrl: app.namedRoutes.build('trial-management.trials.get') + `?isActive=${isActive}`,
            trialNumber,
            tmpBody,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            }
          });

        })
        .catch((err) => {
          app.logger.crit('Failed to fetch trials: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: opts,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        });

    };
  };

  module.exports.postFilterTrial = function(app) {
    return function(req, res) {
      const { isActive } = req.query;
      const validatorResult = validate(req.body, messagingValidator.trialSearch());
            
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('trial-management.trials.get') + `?isActive=${isActive}`);
      }

      return res.redirect(app.namedRoutes.build('trial-management.trials.get') + `?isActive=${isActive}&trialNumber=${encodeURIComponent(req.body.searchTrialNumber)}`);
    };
  };

  module.exports.getTrialDetail = function(app) {
    return function(req, res) {
      let tmpErrors
      let tmpFields
      let successBanner;
      let errorBanner;

      const { trialNumber, locationCode } = req.params;

      tmpErrors = _.clone(req.session.errors);
      tmpFields = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session[`${trialNumber}-${locationCode}-trial`];
      delete req.session[`${trialNumber}-${locationCode}-continueToEndTrial`];
      delete req.session[`${trialNumber}-${locationCode}-reassignPanel`];

      // Clear returns flow
      delete req.session[`${trialNumber}-${locationCode}-handleAttendance`];
      delete req.session[`${trialNumber}-${locationCode}-checkInTime`];
      delete req.session[`${trialNumber}-${locationCode}-checkOutTime`];

      Promise.all([trialDetailsObject.get(
        req,
        trialNumber,
        locationCode
      ), panelListDAO.get(
        req, req.params.trialNumber, req.params.locationCode
      ), panelMemberStatusDAO.get(
        req, req.params.trialNumber, req.params.locationCode
      ).catch(err => {
        app.logger.crit('Unable to fetch panel details, continuing to trial details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return {};
      })])
        .then(([trialData, panelData, addPanelStatus ]) => {

          let canEmpanel = true;

          if (typeof tmpFields === 'undefined') {
            tmpFields = _.clone(trialData);
            tmpFields.defendants = trialData.trial_type === 'criminal' ? trialData.defendants : '';
            tmpFields.respondents = trialData.trial_type === 'civil' ? trialData.defendants : '';
          }

          if (req.session.bannerMessage) {
            successBanner = req.session.bannerMessage;
            delete req.session.bannerMessage;
          }

          if (req.session.bannerError) {
            errorBanner = req.session.bannerError;
            delete req.session.bannerError;
          }

          if (panelData) {
            trialData.panelledJurors = panelData;
            canEmpanel = panelData.filter((juror) => juror.juror_status === 'Panel').length > 0;
          }

          return res.render('trial-management/trial-detail.njk', {
            trial: trialData,
            canEmpanel,
            locationCode,
            successBanner,
            errorBanner,
            addPanelStatus: addPanelStatus.data,
            formActions: {
              returnUrl: app.namedRoutes.build('trial-management.trials.return.post', {
                trialNumber: req.params.trialNumber,
                locationCode: req.params.locationCode,
              }),
              reassignUrl: app.namedRoutes.build('trial-management.trials.reassign.post', {
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
      const { trialNumber, locationCode } = req.params;
      let tmpErrors
      let tmpFields
      let radioToggle = typeof req.session.formFields !== 'undefined' &&
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

      let trialData;
      try {
        trialData = await trialDetailsObject.get(
          req,
          trialNumber,
          locationCode
        );
      } catch (err) {
        app.logger.crit('Failed to fetch trial details: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          body: {
            trialNumber,
            locationCode
          }
        });
        return res.render('_errors/generic', { err });
      }
      

      try {
        let panelData = await panelListDAO.get(
          req, req.params.trialNumber, req.params.locationCode
        );

        if (panelData.length > 0 && typeof req.session[`${trialNumber}-${locationCode}-continueToEndTrial`] === 'undefined') {
          return res.render('trial-management/end-trial/cannot-end-trial.njk', {
            isJuryEmpanelled: trialData['is_jury_empanelled'],
            cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
              trialNumber: req.params.trialNumber,
              locationCode: req.params.locationCode,
            }),
          });
        } else if (panelData.length > 0 && req.session[`${trialNumber}-${locationCode}-continueToEndTrial`]) {
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

        return res.render('_errors/generic', { err });
      };
    };
  };

  module.exports.postEndTrial = function(app) {
    return async function(req, res) {
      try {
        const trialDetails = await trialDetailsObject.get(
          req,
          req.params.trialNumber,
          req.params.locationCode,
        );
        const validateEndTrialDate = validate(req.body, endTrialDateValidator(makeDate(trialDetails.start_date)));

        if (typeof validateEndTrialDate !== 'undefined') {
          req.session.errors = validateEndTrialDate;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('trial-management.trials.end-trial.get', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }));
        }

        if (req.body.endTrial === 'true') {

          let payload = {
            'trial_end_date': dateFilter(req.body.endTrialDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
            'trial_number': req.params.trialNumber,
            'location_code': req.params.locationCode,
          };

          await endTrialObject.patch(req, payload);

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

        if (err.statusCode === 422) {
          if (err.error?.code === 'TRIAL_HAS_MEMBERS') {
            req.session.bannerError = 'Cannot end trial, trial still has members';
          }
          return res.redirect(app.namedRoutes.build('trial-managemeånt.trials.detail.get', {
            trialNumber: req.params.trialNumber,
            locationCode: req.params.locationCode,
          }));
        };

        return res.render('_errors/generic', { err });
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
        value: 'Trial number',
        sort: sortBy === 'trialNumber' ? order : 'none',
      },
      {
        id: 'names',
        value: 'Names',
        sort: sortBy === 'names' ? order : 'none',
      },
      {
        id: 'trialType',
        value: 'Trial type',
        sort: sortBy === 'trialType' ? order : 'none',
      },
      {
        id: 'courtName',
        value: 'Court',
        sort: sortBy === 'courtName' ? order : 'none',
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
        id: 'startDate',
        value: 'Start date',
        sort: sortBy === 'startDate' ? order : 'none',
      },
    );

    trials.forEach(function(trial) {
      let item = [];

      item.push(
        {
          html: '<a href="/trial-management/trials/' +
          encodeURIComponent(trial.trial_number) + '/' +
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
