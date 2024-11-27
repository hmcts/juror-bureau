(() => {
  'use strict';

  const _ = require('lodash')
  const returnsValidator = require('../../../config/validation/return-panel-jury');
  const validate = require('validate.js');
  const { panelListDAO, trialDetailsObject, trialsListDAO } = require('../../../objects');
  const { capitalise } = require('../../../components/filters');
  const { buildMovementProblems } = require('../../../lib/mod-utils');
  const modUtils = require('../../../lib/mod-utils');
  const { reassignPanelDAO } = require('../../../objects/reassign-panel');

  module.exports.postReassignPanel = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    delete req.session.formFields;

    const validatorResult = validate(req.body, returnsValidator.returnPanel());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
      }));
    }

    if (!Array.isArray(req.body.selectedJurors)) {
      req.body.selectedJurors = [req.body.selectedJurors];
    }

    req.session[`${trialNumber}-${locationCode}-reassignPanel`] = {
      selectedJurors: req.body.selectedJurors,
    }
    return res.redirect(app.namedRoutes.build('trial-management.trials.reassign.invalid-jurors.get', {
      trialNumber,
      locationCode,
    }));
  };

  module.exports.getValidateReassignPanel = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    const selectedJurors = req.session[`${trialNumber}-${locationCode}-reassignPanel`].selectedJurors;
    delete req.session.formFields;

    let panelData;
    try {
      panelData = await panelListDAO.get(req, trialNumber, locationCode)
    } catch (err) {
      app.logger.crit('Failed to fetch panel data: ', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic');
    }

    const selectedJurorsData = panelData.filter(juror => selectedJurors.includes(juror['juror_number']));
    
    const invalidJurors = [];
    req.session[`${trialNumber}-${locationCode}-reassignPanel`].invalidJurors = []
    selectedJurorsData.forEach(juror => {
      if (juror['juror_status'] === 'Juror') {
        invalidJurors.push({
            jurorNumber: juror['juror_number'],
            firstName: juror['first_name'],
            lastname: juror['last_name'],
            failureReason: `Invalid Status: ${juror['juror_status']}`,
        });
        req.session[`${trialNumber}-${locationCode}-reassignPanel`].invalidJurors.push(juror['juror_number']);
      }
    });

    if (invalidJurors.length) {
      return res.render('pool-management/movement/bulk-validate', {
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
        continueUrl: app.namedRoutes.build('trial-management.trials.reassign.invalid-jurors.post', {
          trialNumber,
          locationCode,
        }),
        problems: buildMovementProblems({
          unavailableForMove: invalidJurors
        }),
        validStatuses: ['panel', 'juror', 'respondend'],
      });
    }

    return res.redirect(app.namedRoutes.build('trial-management.trials.reassign.select-trial.get', {
      trialNumber,
      locationCode,
    }));
  };

  module.exports.postValidateReassignPanel = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    const selectedJurors = req.session[`${trialNumber}-${locationCode}-reassignPanel`].selectedJurors;
    const invalidJurors = req.session[`${trialNumber}-${locationCode}-reassignPanel`].invalidJurors;
    delete req.session.formFields;

    req.session[`${trialNumber}-${locationCode}-reassignPanel`].selectedJurors = selectedJurors.filter(juror => !invalidJurors.includes(juror));
    delete req.session[`${trialNumber}-${locationCode}-reassignPanel`].invalidJurors

    return res.redirect(app.namedRoutes.build('trial-management.trials.reassign.select-trial.get', {
      trialNumber,
      locationCode,
    }));
  };

  module.exports.getSelectTrial = function(app) {
    return async function(req, res) {
      const { trialNumber, locationCode } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);
      const currentPage = req.query['page'] || 1;
      const sortBy = req.query['sortBy'] || 'trialNumber';
      const sortOrder = req.query['sortOrder'] || 'ascending';
      let pagination;
      const opts = {
        active: true,
        pageNumber: currentPage,
        pageLimit: modUtils.constants.PAGE_SIZE,
        sortField: capitalise(modUtils.camelToSnake(sortBy)),
        sortMethod: sortOrder === 'ascending' ? 'ASC' : 'DESC',
      };

      delete req.session[`${trialNumber}-${locationCode}-reassignPanel`].invalidJurors;
      delete req.session.errors;
      delete req.session.formFields;

      let data;
      try {
        data = await trialsListDAO.post(req, modUtils.mapCamelToSnake(opts));
      } catch (err) {
        app.logger.crit('Failed to fetch trials for reassigning panel: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: opts,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }

      data = modUtils.replaceAllObjKeys(data, _.camelCase);

      app.logger.info('Fetched list of all trials for reassigning panel', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          trials: data,
        },
      });

      // REMOVE CURRENT TRIAL FROM LIST
      data.data = data.data.filter(trial => !(trial.trialNumber === trialNumber && trial.courtLocation === locationCode));

      const queryTotal = data.totalItems;

      if (queryTotal > modUtils.constants.PAGE_SIZE) {
        pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
      }

      return res.render('trial-management/reassign-panel/select-trial.njk', {
        submitUrl: app.namedRoutes.build('trial-management.trials.reassign.select-trial.get', {
          trialNumber,
          locationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
        tmpBody,
        pagination,
        trials: modUtils.transformRadioSelectTrialsList(data.data, sortBy, sortOrder, true),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postSelectTrial = function(app) {
    return function(req, res) {
      const { trialNumber, locationCode } = req.params;

      if (typeof req.body.selectedTrial === 'undefined') {
        req.session.errors = {
          selectedTrial: [{
            summary: 'Select a trial to reassign the juror(s) into',
            details: 'Select a trial to reassign the juror(s) into',
          }],
        };
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('trial-management.trials.reassign.select-trial.get', {
          trialNumber,
          locationCode,
        }));
      };


      const newTrialNumber = req.body.selectedTrial.substring(0, req.body.selectedTrial.lastIndexOf('-'));
      const newLocationCode = req.body.selectedTrial.substring(req.body.selectedTrial.lastIndexOf('-') + 1);

      return res.redirect(app.namedRoutes.build('trial-management.trials.reassign.confirm.get', {
        trialNumber,
        locationCode,
        newTrialNumber,
        newLocationCode,
      }));
    };
  };

  module.exports.getConfirmReassignPanel = function(app) {
    return async function(req, res) {
      const { trialNumber, locationCode, newTrialNumber, newLocationCode } = req.params;
      const selectedJurors = req.session[`${trialNumber}-${locationCode}-reassignPanel`].selectedJurors;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      let trialDetails;
      try {
        trialDetails = await trialDetailsObject.get(
          req,
          newTrialNumber,
          newLocationCode
        )
      } catch (err) {
        app.logger.crit('Failed to fetch trial details for reassiging panel: ', {
          auth: req.session.authentication,
          data: {
            newTrialNumber,
            locationCode
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }

      let panelMembers;
      try {
        panelMembers = await panelListDAO.get(
          req,
          trialNumber,
          locationCode
        )
      } catch (err) {
        app.logger.crit('Failed to fetch panel members for reassiging panel: ', {
          auth: req.session.authentication,
          data: {
            trialNumber,
            locationCode
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }

      const jurors = panelMembers.filter(juror => selectedJurors.includes(juror['juror_number']));

      return res.render('trial-management/reassign-panel/confirm-reassign', {
        jurors,
        trial: trialDetails,
        continueUrl: app.namedRoutes.build('trial-management.trials.reassign.confirm.post', {
          trialNumber,
          locationCode,
          newTrialNumber,
          newLocationCode,
        }),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      })
    };
  };

  module.exports.postConfirmReassignPanel = function(app) {
    return async function(req, res) {
      const { trialNumber, locationCode, newTrialNumber, newLocationCode } = req.params;
      const selectedJurors = req.session[`${trialNumber}-${locationCode}-reassignPanel`].selectedJurors;

      try {
        await reassignPanelDAO.post(req, {
          jurors: selectedJurors,
          source_trial_number: trialNumber,
          source_trial_loc_code: locationCode,
          target_trial_number: newTrialNumber,
          target_trial_loc_code: newLocationCode,
        });
      } catch (err) {
        app.logger.crit('Failed to reassign panel members: ', {
          auth: req.session.authentication,
          data: {
            jurors: selectedJurors,
            source_trial_number: trialNumber,
            source_trial_loc_code: locationCode,
            target_trial_number: newTrialNumber,
            target_trial_loc_code: newLocationCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        const standardErrorMessage = `Failed to reassign ${selectedJurors.length} panel member${selectedJurors.length ? 's' : ''} to trial ${newTrialNumber}`;

        if (err.error.statusCode = 422) {
          switch (err.error.code) {
            case 'CANNOT_RE_ADD_JUROR_TO_PANEL':
              req.session.errors = modUtils.makeManualError(
                'invalidData',
                'Juror(s) can not be reassigned back to a panel they have already been on',
              );
              break;
            case 'UNCONFIRMED_ATTENDANCE_EXISTS': 
              req.session.errors = modUtils.makeManualError(
                'invalidData',
                '1 or more juror(s) have an unconfirmed attendance for this trial',
              );
              break;
            default:
              req.session.errors = modUtils.makeManualError(
                'invalidData',
                err.error.message ? err.error.message : standardErrorMessage,
              );
          }
        } else  {
          req.session.errors = modUtils.makeManualError(
            'selectedJurors', 
            standardErrorMessage
          );
        }

        return res.redirect(app.namedRoutes.build('trial-management.trials.reassign.confirm.get', {
          trialNumber,
          locationCode,
          newTrialNumber,
          newLocationCode,
        }));
      }

      delete req.session[`${trialNumber}-${locationCode}-reassignPanel`];

      const newTrialLink = app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: newTrialNumber,
        locationCode: newLocationCode,
      });

      req.session.bannerMessage = `${selectedJurors.length} panel member${selectedJurors.length ? 's' : ''} reassigned to trial <a href=${newTrialLink}>${newTrialNumber}</a>`

      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
      }));
    };
  };

})();