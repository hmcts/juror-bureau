(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const modUtils = require('../../../../lib/mod-utils.js');
  const reassignBeforeProcessValidator = require('../../../../config/validation/reassign-before-process.js')
    .reassignBeforeProcess;
  const CourtNameOrLocationValidator = require('../../../../config/validation/request-pool.js').courtNameOrLocation;
  const selectedActivePoolValidator = require('../../../../config/validation/pool-management.js')
    .deferralMaintenance.selectedActivePool;
  const requestCourtsObj = require('../../../../objects/request-pool').fetchCourts;
  const { systemCodesDAO } = require('../../../../objects/administration');
  const excusalObj = require('../../../../objects/excusal-mod.js').excusalObject;
  const excusalValidator = require('../../../../config/validation/excusal-mod.js');
  const requestObj = require('../../../../objects/pool-management.js').reassignJurors;
  const { record } = require('../../../../objects/juror-record.js');

  module.exports.getReassignBeforeProcess = (app) => async (req, res) =>{
    const { id, type } = req.params;
    delete req.session.receivingCourtLocCode;

    // Excusal decision BEFORE reassigning court.
    if (req.params.action === 'excusal') {
      return res.redirect(app.namedRoutes.build('reassign-before-process.excusal.get', {
        id,
        type,
      }));
    }
    try {
      // Only fetch courts list if not known.
      if (!req.session.courtsList || !req.session.transformedCourtsList) {
        try {
          const { courts } = await requestCourtsObj.get(req);

          req.session.courtsList = courts;
          req.session.transformedCourtsList = modUtils.transformCourtNames(courts);
        } catch (err) {
          app.logger.crit('Failed to retrieve courts list: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic', { err });
        }

      }
      const currentCourt = req.session.courtsList.find(elem => elem.locationCode === req.session.locCode);

      currentCourt.formattedName = modUtils.transformCourtName(currentCourt);

      const tmpErrors = _.clone(req.session.errors),
        tmpFields = req.session.formFields;

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('summons-management/process-reply/reassign-before-process', {
        jurorNumber: id,
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('process-reply.get', {
            id,
            type,
          }),
        },
        processUrl: app.namedRoutes.build('reassign-before-process.post', {
          id,
          type,
          action: req.params.action,
        }),
        catchmentWarning: req.session[`catchmentWarning-${req.params.id}`],
        currentCourt: currentCourt,
        courts: req.session.transformedCourtsList,
        userInput: tmpFields,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    } catch (err) {
      app.logger.crit('Failed to fetch reassign before process details: ', {
        auth: req.session.authentication,
        data: req.params,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  };

  module.exports.postReassignBeforeProcess = (app) =>  (req, res) => {
    const { id, type, action } = req.params;
    let validatorResult = validate(req.body, reassignBeforeProcessValidator());

    if (typeof validatorResult === 'undefined' && req.body.selectCourt === 'differentCourt') {
      validatorResult = validate(req.body, CourtNameOrLocationValidator());
    }

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('reassign-before-process.get', {
        id,
        type,
        action,
      }));
    }

    // Retrieve court name or location from autocomplete or radio button
    const courtNameOrLocation = req.body.selectCourt === 'differentCourt'
      ? req.body.courtNameOrLocation
      : req.body.selectCourt;

    try {
      const court = modUtils.matchUserCourt(req.session.courtsList, {
        courtNameOrLocation: courtNameOrLocation,
      })

      if (court.locationCode === req.session.locCode) {
        if (action === 'excused' && req.session[`reassignExcusalPayload-${id}`]?.excusalDecision === 'REFUSE') {
          return sendExcusalRequest(app)(req, res, req.session[`reassignExcusalPayload-${id}`]);
        }
        return res.redirect(app.namedRoutes.build(actionPaths(action, type), {
          id: id,
          type: type,
        }));
      }

      req.session.receivingCourtLocCode = court.locationCode;

      res.redirect(app.namedRoutes.build('reassign-before-process.available-pools.get', {
        id,
        type,
        action,
      }));
    } catch (err) {
      req.session.formFields = req.body;
      req.session.errors = {
        courtNameOrLocation: [
          {
            summary: 'Please check the court name or location',
            details: 'This court does not exist. Please enter a name or code of an existing court',
          },
        ],
      };
      return res.redirect(app.namedRoutes.build('reassign-before-process.get', {
        id,
        type,
        action,
      }));
    }
  };

  module.exports.getReassignBeforeProcessPools = (app) => async (req, res) =>{
    const { id, type, action } = req.params;

    let availablePoolsResponse;
    try {
      availablePoolsResponse = await requestObj.availablePools.get(req, req.session.receivingCourtLocCode);
    } catch (err) {
      app.logger.crit('Failed to fetch available pools: ', {
        auth: req.session.authentication,
        data: {
          locCode: req.session.receivingCourtLocCode,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic', { err });
    }

    const court = req.session.courtsList.find(c => c.locationCode === req.session.receivingCourtLocCode);
    const tmpErrors = _.clone(req.session.errors);

    try {
      req.session[`reassignProcessCurrentPool-${id}`] = (await record.get(
        req,
        'detail',
        id,
        req.session.locCode,
      )).data.commonDetails.poolNumber;
    } catch (err) {
      app.logger.crit('Failed to fetch the juror\'s current details', {
        auth: req.session.authentication,
        jurorNumber: id,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    const filteredPools = availablePoolsResponse.availablePools
        .filter(pool => pool.poolNumber !== req.session[`reassignProcessCurrentPool-${id}`]);

    delete req.session.errors;
    delete req.session.fields;

    app.logger.info('Fetched available pools for reassigning a juror', {
      auth: req.session.authentication,
      data: {
        availablePoolsResponse,
        court,
      },
    });

    return res.render('juror-management/reassign/pools', {
      jurorNumber: id,
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('reassign-before-process.get', { id, type, action }),
      },
      processUrl: app.namedRoutes.build('reassign-before-process.available-pools.post', { id, type, action }),
      changeCourtUrl: app.namedRoutes.build('reassign-before-process.select-court.get', { id, type, action }),
      pools: filteredPools,
      court,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postReassignBeforeProcessPools = (app) => async (req, res) => {
    const { id, type, action } = req.params;

    const validatorResult = validate(req.body, selectedActivePoolValidator());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('reassign-before-process.available-pools.get', { id, type, action }));
    }

    const payload = {
      jurorNumbers: [id],
      receivingCourtLocCode: req.body.poolNumber.substring(0, 3),
      receivingPoolNumber: req.body.poolNumber,
      sourceCourtLocCode: req.session.locCode,
      sourcePoolNumber: req.session[`reassignProcessCurrentPool-${id}`],
    };

    try {
      await requestObj.reassignJuror.put(req, payload);

      req.session.locCode = req.session.receivingCourtLocCode;
      delete req.session.receivingCourtLocCode;
      delete req.session[`reassignProcessCurrentPool-${id}`];

      if (action === 'excused' && req.session[`reassignExcusalPayload-${id}`]?.excusalDecision === 'REFUSE') {
        return sendExcusalRequest(app)(req, res, req.session[`reassignExcusalPayload-${id}`]);
      }

      return res.redirect(app.namedRoutes.build(actionPaths(action, type), { id, type }));
    } catch (err) {
      app.logger.crit('Failed to reassign the juror to a different pool', {
        auth: req.session.authentication,
        data: {
          juror: payload.jurorNumbers,
          newPool: payload.receivingPoolNumber,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic', { err });
    }
  };

  module.exports.getReassignBeforeProcessChangeCourt = (app) => (req, res) => {
    const { id, type, action } = req.params;
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    const cancelUrl = type === 'paper'
      ? app.namedRoutes.build('response.paper.details.get', { id, type })
      : app.namedRoutes.build('response.detail.get', { id, type });

    return res.render('pool-management/_common/select-court', {
      currentApp: 'Summons Management',
      submitUrl: app.namedRoutes.build('reassign-before-process.select-court.post', { id, type, action }), 
      cancelUrl: cancelUrl,
      pageIdentifier: 'Reassign juror',
      pageTitle: 'Select a court to reassign to',
      courts: req.session.transformedCourtsList,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postReassignBeforeProcessChangeCourt = (app) => (req, res) => {
    const { id, type, action } = req.params;
    const courtNameOrLocation = req.body.courtNameOrLocation;

    if (!courtNameOrLocation || !courtNameOrLocation.length) {
      req.session.errors = {
        courtNameOrLocation: [
          {
            summary: 'Enter a court name or location code',
            details: 'Enter a court name or location code',
          },
        ],
      };
      return res.redirect(app.namedRoutes.build('reassign-before-process.select-court.get', { id, type, action }));
    }

    try {
      const court = modUtils.matchUserCourt(req.session.courtsList, { courtNameOrLocation });

      req.session.receivingCourtLocCode = court.locationCode;

      return res.redirect(app.namedRoutes.build('reassign-before-process.available-pools.get', { id, type, action }));
    } catch (err) {
      req.session.errors = {
        courtNameOrLocation: [
          {
            summary: 'Please check the court name or location',
            details: 'This court does not exist. Please enter a name or code of an existing court',
          },
        ],
      };
      return res.redirect(app.namedRoutes.build('reassign-before-process.select-court.get', { id, type, action }));
    }
  };

  module.exports.getReassignBeforeProcessExcusal = (app) => async (req, res) => {
    const { id, type } = req.params;

    delete req.session[`reassignExcusalPayload-${req.params.id}`];
    try {
      if (!req.session.excusalReasons) {
        req.session.excusalReasons = await systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL');

        app.logger.info('Retrieved excusal codes: ', {
          auth: req.session.authentication,
          id,
          type,
          response: req.session.excusalReasons,
        });
      }

      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = req.session.formFields;

      delete req.session.errors;
      delete req.session.formFields;

      const processUrl = app.namedRoutes.build('reassign-before-process.excusal.post', { id, type });
      const cancelUrl = type === 'paper'
          ? app.namedRoutes.build('response.paper.details.get', { id, type })
          : app.namedRoutes.build('response.detail.get', { id, type });

      return res.render('summons-management/excusal', {
        processUrl: processUrl,
        cancelUrl: cancelUrl,
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('process-reply.get', { id, type }),
        },
        excusalDetails: tmpFields,
        excusalReasons: req.session.excusalReasons,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    } catch (err) {
      app.logger.crit('Failed to retrieve excusal: ', {
        auth: req.session.authentication,
        id,
        type,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic', { err });
    }
  };

  module.exports.postReassignBeforeProcessExcusal = (app) => (req, res) => {
    const { id, type, action } = req.params;

    const validatorResult = validate(req.body, excusalValidator());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('reassign-before-process.excusal.get', { id, type, action }));
    }

    if (req.body.excusalDecision === 'GRANT') {
      return sendExcusalRequest(app)(req, res, req.body);
    }

    req.session[`reassignExcusalPayload-${req.params.id}`] = req.body;
    // if refused we need to offer chance to reassign
    return res.redirect(app.namedRoutes.build('reassign-before-process.get', {
      id,
      type,
      action: 'excused',
    }));
      
  };

  const actionPaths = (action, responseType) => {
    const actionPaths = {
      responded: 'response.detail.responded.get',
      deferral: 'process-deferral-dates.get',
      excused: responseType === 'paper' ? 'response.paper.details.get' : 'response.detail.get',
    }
    return actionPaths[action];
  }

  const sendExcusalRequest = (app) => async (req, res, payload) => {
    const { id, type } = req.params;

    try {
      await excusalObj.put(
        req,
        payload,
        id,
        type
      );

      app.logger.info('Excusal processed (reassign before process): ', {
        auth: req.session.authentication,
        data: { body: payload, jurorNumber: id },
      });

      const codeMessage = (code) => req.session.excusalReasons
          .filter((el) => el.code === code)[0].description,
        reason = {
          REFUSE: 'Excusal refused (' + codeMessage(payload.excusalCode).toLowerCase() + ')',
          GRANT: 'Excusal granted (' + codeMessage(payload.excusalCode).toLowerCase() + ')',
        };

      req.session.responseWasActioned = {
        jurorDetails: req.session.replyDetails,
        type: reason[payload.excusalDecision],
      };

      delete req.session.excusalReasons;
      delete req.session[`reassignExcusalPayload-${id}`];

      if (type === 'paper') {
        return res.redirect(app.namedRoutes.build('response.paper.details.get', req.params));
      }
      return res.redirect(app.namedRoutes.build('response.detail.get', req.params));
    } catch (err) {
      app.logger.crit('Failed to process excusal (reassign before process): ', {
        auth: req.session.authentication,
        data: { body: payload, jurorNumber: id },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  }

})();
