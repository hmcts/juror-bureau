(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const { isCourtUser } = require('../../../components/auth/user-type');
  const jurorUpdateValidator = require('../../../config/validation/juror-record-update');
  const jurorRecordObject = require('../../../objects/juror-record');
  const deferralObject = require('../../../objects/deferral-mod').deferralObject;
  const { jurorDeceasedObject } = require('../../../objects/juror-deceased');
  const jurorTransfer = require('../../../objects/juror-transfer').jurorTransfer;
  const { dateFilter } = require('../../../components/filters');
  const { systemCodesDAO, markAsUndeliverableDAO } = require('../../../objects');
  const moment = require('moment');
  const { deferralPoolsObject, changeDeferralObject } = require('../../../objects/deferral-mod');
  const { deferralReasonAndDecision, deferralDateAndPool } = require('../../../config/validation/deferral-mod');
  const { flowLetterGet, flowLetterPost } = require('../../../lib/flowLetter');
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.index = function(app) {
    return async function(req, res) {
      let jurorDetails;

      try {
        jurorDetails = (await jurorRecordObject.record.get(
          req,
          'detail',
          req.params['jurorNumber'],
          req.session.locCode || req.session.authentication.locCode,
        )).data;
      } catch (err) {
        app.logger.crit('Failed to fetch juror record details: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: req.params['jurorNumber'],
            locationCode: req.session.locCode || req.session.authentication.locCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
  
        return res.render('_errors/generic');
      }

      let processUrl;
      let cancelUrl;
      let tmpErrors;
      let radioChecked;
      let thirdPartyDeceased = false;

      tmpErrors = _.cloneDeep(req.session.errors);
      radioChecked = _.cloneDeep(req.session.updateOption);
      thirdPartyDeceased = _.cloneDeep(req.session.thirdPartyDeceased);
      delete req.session.errors;
      delete req.session.updateOption;
      delete req.session.thirdPartyDeceased;
      delete req.session.replyMethod;
      delete req.session.processLateSummons;

      req.session.replyMethod = jurorDetails.replyMethod;

      processUrl = app.namedRoutes.build('juror.update.post', { jurorNumber: req.params['jurorNumber'] });
      cancelUrl = app.namedRoutes.build('juror-record.overview.get', { jurorNumber: req.params['jurorNumber'] });

      let attendanceData = {};

      // only court users can see attendance details and they're only needed for court owned records
      if (isCourtUser(req)) {
        try {
          attendanceData = await jurorRecordObject.attendanceDetails.get(
            req,
            req.params['jurorNumber'],
          );
        } catch (err) {
          app.logger.crit('Failed to fetch juror attendance details: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber: req.params['jurorNumber'],
              locCode: req.session.locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      }

      return res.render('juror-management/update-juror-record.njk', {
        jurorNumber: req.params.jurorNumber,
        owner: jurorDetails.commonDetails.owner,
        excusalCode: jurorDetails.commonDetails.excusalCode,
        hasAppearances: attendanceData.hasAppearances,
        attendances: attendanceData.attendances,
        onCall: attendanceData.onCall,
        processUrl,
        cancelUrl,
        radioChecked: radioChecked,
        thirdPartyDeceased: thirdPartyDeceased,
        replyStatus: jurorDetails.replyProcessingStatus,
        errors: {
          message: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        isCourtUser: isCourtUser(req),
        jurorStatus: jurorDetails.commonDetails.jurorStatus,
        jurorDOB: jurorDetails.dateOfBirth,
      });
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      let validatorResult;
      const postPaths = {
        deferral: 'juror.update.deferral.get',
        transfer: 'juror.update.transfer.get',
        reassign: 'juror-management.reassign.get',
        postpone: 'juror.update.postpone-date.get',
        complete: 'juror.update.complete-service.get',
        'failed-to-attend': 'juror.update.failed-to-attend.get',
        'undo-failed-to-attend': 'juror.update.failed-to-attend.undo.get',
        excusal: 'juror.excusal.get',
        disqualify: 'juror.update.disqualify.get',
        responded: 'juror.update.responded.get',
      };

      validatorResult = validate(req.body, jurorUpdateValidator.updateOptions());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      if (req.body.jurorRecordUpdate === 'deceased') {
        return postDeceased(req, res, app);
      } else if (req.body.jurorRecordUpdate === 'undeliverable') {
        return postUndeliverable(req, res, app);
      }

      if (req.body.jurorRecordUpdate === 'disqualify') {
        return res.redirect(app.namedRoutes.build('juror.update.disqualify.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      if (req.body.jurorRecordUpdate === 'responded') {
        return res.redirect(app.namedRoutes.build('juror.update.responded.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      // Just a small fallback error message to avoid displaying stack traces when the option is not available yet
      // TODO: remove when all are implemented
      if (typeof postPaths[req.body.jurorRecordUpdate] === 'undefined') {
        req.session.errors = {
          jurorRecordUpdate: [{
            summary: 'This option is not implemented yet',
            details: 'This option is not implemented yet',
          }],
        };

        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      return res.redirect(app.namedRoutes.build(postPaths[req.body.jurorRecordUpdate], {
        jurorNumber: req.params.jurorNumber,
      }));
    };
  };

  module.exports.getDeferral = function(app) {
    return function(req, res) {
      const cancelUrl = app.namedRoutes.build('juror-record.overview.get', { jurorNumber: req.params['jurorNumber'] });

      systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL')
        .then((data) => {
          app.logger.info('Fetched list of deferral reasons: ', {
            auth: req.session.authentication,
            data: {
              responseId: req.params.jurorNumber,
              reasons: data,
            },
          });

          const tmpFields = _.cloneDeep(req.session.formFields);
          const tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          const processURL = app.namedRoutes.build('juror.update.deferral.post', { jurorNumber: req.params.jurorNumber });
          req.session.deferralReasons = data;

          let minDate = req.session.jurorCommonDetails.startDate;
          const maxDate = moment(minDate, 'yyyy-MM-DD').add(1, 'y').format('YYYY-MM-DD');

          return res.render('response/process/deferral.njk', {
            deferralDetails: tmpFields,
            deferralReasons: data,
            jurorNumber: req.params.jurorNumber,
            processURL : processURL,
            cancelUrl : cancelUrl,
            hearingDate: dateFilter(minDate, null, 'DD/MM/YYYY'),
            maxDate: dateFilter(maxDate, null, 'DD/MM/YYYY'),
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch list of deferral reasons: ', {
            auth: req.session.authentication,
            data: {
              responseId: req.params.jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.errors = {
            deferralReasons: [{
              summary: 'Failed to fetch list of deferral reasons',
              details: 'Failed to fetch list of deferral reasons',
            }],
          };
          return res.redirect(app.namedRoutes.build(
            'juror-record.overview.get',
            { jurorNumber: req.params.jurorNumber },
          ));
        });
    };
  };

  module.exports.postDeferral = function(app) {
    return async function(req, res) {
      let tmpReasons
      let deferralReason;

      tmpReasons = _.cloneDeep(req.session.deferralReasons);

      const { hearingDate } = req.body;

      const maxDate = moment(hearingDate, 'DD/MM/YYYY').add(1, 'y').add(1, 'd').format('YYYY-MM-DD');

      const validatorResult = validate(req.body, deferralReasonAndDecision(req.body, dateFilter(hearingDate, 'DD/MM/YYYY', 'yyyy-MM-DD'), maxDate));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror.update.deferral.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      delete req.session.errors;
      delete req.session.formFields;

      if (req.body.deferralDecision === "GRANT") {
        let pools;
        try {
          pools = await deferralPoolsObject.post(
            req,
            [dateFilter(req.body.deferralDate, 'DD/MM/YYYY', 'yyyy-MM-DD')],
            req.params.jurorNumber
          );
        } catch (err) {
          app.logger.crit('Failed to fetch deferral pools: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber: req.params.jurorNumber,
              date: dateFilter(req.body.deferralDate, 'DD/MM/YYYY', 'yyyy-MM-DD')
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
        
        if (pools.deferralPoolsSummary[0].deferralOptions[0].poolNumber) {
          req.session.deferralPools = pools.deferralPoolsSummary[0];
          req.session.partialDeferralObj = req.body;

          return res.redirect(app.namedRoutes.build('juror.update.deferral.pools.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        }
      }

      if (!tmpReasons) {
        try {
          tmpReasons = await systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL');
        } catch (err) {
          app.logger.crit('Failed to fetch system codes: ', {
            auth: req.session.authentication,
            data: { codes: 'EXCUSAL_AND_DEFERRAL' },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      }

      deferralReason = tmpReasons
        .find(reason => reason.code === req.body.deferralReason).description.toLowerCase();

      deferralObject.put(req, req.body, req.params.jurorNumber)
        .then((data) => {
          app.logger.info('Deferral update processed: ', {
            auth: req.session.authentication,
            data: {
              responseId: req.params.jurorNumber,
            },
            reasons: data,
          });

          if (req.body.deferralDecision === 'REFUSE') {
            req.session.bannerMessage = 'Deferral refused (' + deferralReason + ')';
          } else {
            req.session.bannerMessage = 'Deferral granted (' + deferralReason + ')';
          }

          if (res.locals.isCourtUser) {
            return res.redirect(app.namedRoutes.build('juror.update.deferral.letter.get', {
              jurorNumber: req.params.jurorNumber,
              letter: req.body.deferralDecision.toLowerCase(),
            }));
          }

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        })
        .catch((err) => {
          app.logger.crit('Failed to process deferral update: ', {
            auth: req.session.authentication,
            data: {
              responseId: req.params.jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === 422) {
            switch (err.error?.code) {
              case 'CANNOT_REFUSE_FIRST_DEFERRAL':
                app.logger.warn('Failed to decline deferral for juror', {
                  auth: req.session.authentication,
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                req.session.errors = makeManualError('deferral', 'Cannot refuse first deferral');
                break;
              case 'JUROR_HAS_BEEN_DEFERRED_BEFORE':
                app.logger.warn('Failed to decline deferral for juror', {
                  auth: req.session.authentication,
                  error: typeof err.error !== 'undefined' ? err.error : err.toString(),
                });
                return res.redirect(app.namedRoutes.build('juror.update.deferral.confirm.get', {
                  jurorNumber: req.params.jurorNumber,
                }) + `?deferralReason=${req.body.deferralReason}&deferralDate=${req.body.deferralDate}`);
              case 'CANNOT_DEFER_JUROR_WITH_APPEARANCE':
                req.session.errors = makeManualError('deferral', 'Juror cannot be deferred as they already have an appearance at court');
                break;
              default:
                req.session.errors = makeManualError('deferral', 'Something went wrong when trying to defer the juror');
            }
          }

          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('juror.update.deferral.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        });
    };
  };

  module.exports.getDeferralPools = (app) => (req, res) => {
    const deferralPoolWeek = req.session.deferralPools;
    const tmpErrors = req.session.errors;

    delete req.session.errors;

    return res.render('juror-management/edit/deferral-available-pools', {
      jurorNumber: req.params.jurorNumber,
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('juror.update.deferral.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      },
      processUrl: app.namedRoutes.build('juror.update.deferral.pools.post', {
        jurorNumber: req.params.jurorNumber,
      }),
      hasActivePools: true,
      deferralPoolWeek,
      selectedDeferralDate: '',
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  }

  module.exports.postDeferralPools = (app) => async (req, res) => {
    let validatorResult = validate(req.body, deferralDateAndPool());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('juror.update.deferral.pools.get', {
        jurorNumber: req.params['jurorNumber'],
      }));
    }

    const deferReason = req.session.partialDeferralObj.deferralReason;

    try {
      await deferralObject.post(
        req,
        req.params.jurorNumber,
        req.body.deferralDateAndPool.split("_")[1],
        req.body.deferralDateAndPool.split("_")[0],
        deferReason,
      );

      delete req.session.deferralPools;
      delete req.session.partialDeferralObj;

      const reason = req.session.deferralReasons.filter(item => item.code === deferReason);

      req.session.bannerMessage = 'Deferral granted (' + (reason.length > 0 ? reason[0].description : deferReason) + ')';

      if (res.locals.isCourtUser) {
        return res.redirect(app.namedRoutes.build('juror.update.deferral.letter.get', {
          jurorNumber: req.params.jurorNumber,
          letter: req.body.deferralDecision.toLowerCase(),
        }));
      }

      return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: req.params.jurorNumber,
      }));
    }

    catch (err) {
      if (err.statusCode === 422 ) {
        app.logger.crit('Failed to process Deferral - business rule violation ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: req.body,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        switch (err.error?.code) {
          case 'CANNOT_DEFER_TO_EXISTING_POOL':
            req.session.errors = makeManualError('deferralDateAndPool', 'You cannot defer into the juror\'s existing pool - please select a different pool or date');
            break;
          case 'JUROR_DATE_OF_BIRTH_REQUIRED':
            req.session.errors = makeManualError('defer', 'You cannot defer a juror without a date of birth - please add date of birth to the juror record');
            break;
          default:
            req.session.errors = makeManualError('defer', 'Something went wrong when trying to defer the juror');
            break;
        }

        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('juror.update.deferral.pools.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      app.logger.crit('Failed to defer juror: ', {
        auth: req.session.authentication,
        data: { codes: 'EXCUSAL_AND_DEFERRAL' },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }
}

  module.exports.getConfirmDeferral = (app) => {
    return (req, res) => {
      const { jurorNumber } = req.params;
      const { deferralReason, deferralDate } = req.query;

      app.logger.info('Showing confirm deferral page for juror', {
        auth: req.session.authentication,
        data: {
          jurorNumber,
          deferralReason,
          deferralDate,
        },
      });

      const postUrl = app.namedRoutes.build('juror.update.deferral.post', { jurorNumber });

      const hearingDate = req.session.jurorCommonDetails.startDate;

      return res.render('juror-management/juror-record/confirm-deferral.njk', {
        jurorNumber,
        deferralReason,
        deferralDate,
        postUrl,
        hearingDate,
      });
    }
  };

  module.exports.getDeferralLetter = function(app) {
    return function(req, res) {
      const letterType = req.params.letter === 'grant' ? 'granted' : 'refused';

      return flowLetterGet(req, res, {
        serviceTitle: 'send letter',
        pageIdentifier: 'process - deferral',
        currentApp: '',
        letterMessage: `a deferral ${letterType}`,
        letterType: `deferral-${letterType}`,
        postUrl: app.namedRoutes.build('juror.update.deferral.letter.post', {
          jurorNumber: req.params.jurorNumber,
          letter: req.params.letter,
        }),
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      });
    };
  };

  module.exports.postDeferralLetter = function(app) {
    return function(req, res) {
      return flowLetterPost(req, res, {
        errorRoute: app.namedRoutes.build('juror.update.deferral.letter.get', {
          jurorNumber: req.params.jurorNumber,
          letter: req.params.letter,
        }),
        pageIdentifier: 'process - deferral',
        serviceTitle: 'send letter',
        currentApp: '',
        completeRoute: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      });
    };
  };

  module.exports.postCourtTransferConfirm = function(app) {
    return function(req, res) {
      let newServiceStartDate;
      let receivingCourtLocCode;
      let sourcePoolNumber;

      receivingCourtLocCode = req.session.formField.courtNameOrLocation.match(/\d+/g)[0];

      newServiceStartDate = dateFilter(req.session.formField.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD');

      sourcePoolNumber = _.cloneDeep(req.session.jurorUpdate.poolNumber);

      jurorTransfer.put(
        req,
        req.params.jurorNumber,
        receivingCourtLocCode,
        newServiceStartDate,
        sourcePoolNumber)
        .then((data) => {
          app.logger.info('Juror succesfully transferred: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber: req.params.jurorNumber,
              receivingCourt: receivingCourtLocCode,
              data: data,
            },
          });

          req.session.bannerMessage = 'juror transferred to ' + req.session.formField.courtNameOrLocation;

          delete req.session.formField;
          delete req.session.jurorUpdate;

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        })
        .catch((err) => {
          app.logger.crit('Failed to transfer juror: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber: req.params.jurorNumber,
              receivingCourt: receivingCourtLocCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

  function postDeceased(req, res, app) {
    const validatorResult = validate(req.body, jurorUpdateValidator.deceasedComment());
    
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.updateOption = req.body.jurorRecordUpdate;
      req.session.thirdPartyDeceased = req.body.thirdPartyDeceased;

      return res.redirect(app.namedRoutes.build('juror.update.get', {
        jurorNumber: req.params.jurorNumber,
      }));
    }

    jurorDeceasedObject.post(req, req.body, req.params.jurorNumber)
      .then((data) => {
        app.logger.info('Juror processed as deceased: ', {
          auth: req.session.authentication,
          data: {
            responseId: req.params.jurorNumber,
            reasons: data,
          },
        });

        req.session.bannerMessage = 'Deceased';

        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      })
      .catch((err) => {
        app.logger.crit('Failed to process juror as deceased: ', {
          auth: req.session.authentication,
          data: {
            responseId: req.params.jurorNumber,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = {
          deceased: [{
            summary: 'Failed to process juror as deceased',
            details: 'Failed to process juror as deceased',
          }],
        };
        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      });
  }

  function postUndeliverable(req, res, app) {
    markAsUndeliverableDAO.patch(req, { 'jurorNumbers': [req.params.jurorNumber] })
      .then((data) => {
        app.logger.info('Juror processed as undeliverable: ', {
          auth: req.session.authentication,
          data: {
            responseId: req.params.jurorNumber,
            reasons: data,
          },
        });

        req.session.bannerMessage = 'Summons undeliverable';

        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      })
      .catch((err) => {
        app.logger.crit('Failed to process juror as undeliverable: ', {
          auth: req.session.authentication,
          data: {
            responseId: req.params.jurorNumber,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = {
          undeliverable: [{
            summary: 'Failed to mark summons as undeliverable',
            details: 'Failed to mark summons as undeliverable',
          }],
        };
        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      });
  }

})();
