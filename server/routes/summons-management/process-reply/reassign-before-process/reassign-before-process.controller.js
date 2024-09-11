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

  module.exports.getReassignBeforeProcess = (app) => {
    return async(req, res) => {
      delete req.session.receivingCourtLocCode;

      // Excusal decision BEFORE reassigning court.
      if (req.params.action === 'excusal') {
        return res.redirect(app.namedRoutes.build('reassign-before-process.excusal.get', {
          id: req.params.id,
          type: req.params.type,
        }));
      }
      try {
        // Only fetch courts list if not known.
        if (!req.session.courtsList || !req.session.transformedCourtsList) {
          try {
            const { courts } = await requestCourtsObj.get(require('request-promise'), app, req.session.authToken);

            req.session.courtsList = courts;
            req.session.transformedCourtsList = modUtils.transformCourtNames(courts);
          } catch (err) {
            app.logger.crit('Failed to retrieve courts list: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });
            return res.render('_errors/generic');
          }

        }
        const currentCourt = req.session.courtsList.find(elem => elem.locationCode === req.session.locCode);

        currentCourt.formattedName = modUtils.transformCourtName(currentCourt);

        const tmpErrors = _.clone(req.session.errors),
          tmpFields = req.session.formFields;

        delete req.session.errors;
        delete req.session.formFields;


        return res.render('summons-management/process-reply/reassign-before-process',
          {
            jurorNumber: req.params.id,
            backLinkUrl: {
              built: true,
              url: app.namedRoutes.build('process-reply.get', {
                id: req.params.id,
                type: req.params.type,
              }),
            },
            processUrl: app.namedRoutes.build('reassign-before-process.post', {
              id: req.params.id,
              type: req.params.type,
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
          }
        );
      } catch (err) {
        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postReassignBeforeProcess = (app) => {
    return (req, res) => {

      let validatorResult = validate(req.body, reassignBeforeProcessValidator());

      if (typeof validatorResult === 'undefined' && req.body.selectCourt === 'differentCourt') {
        validatorResult = validate(req.body, CourtNameOrLocationValidator());
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reassign-before-process.get', {
          id: req.params.id,
          type: req.params.type,
          action: req.params.action,
        }));
      }

      // Retrieve court name or location from autocomplete or radio button
      const courtNameOrLocation = req.body.selectCourt === 'differentCourt'
        ? req.body.courtNameOrLocation
        : req.body.selectCourt;

      modUtils.matchUserCourt(req.session.courtsList, {
        courtNameOrLocation: courtNameOrLocation,
      }).then(
        (court) => {
          if (court.locationCode === req.session.locCode) {
            return res.redirect(app.namedRoutes.build(actionPaths(req.params.action, req.params.type), {
              id: req.params.id,
              type: req.params.type,
            }));
          }

          req.session.receivingCourtLocCode = court.locationCode;

          if (req.params.action === 'deferral') {
            return res.redirect(app.namedRoutes.build(actionPaths(req.params.action, req.params.type), {
              id: req.params.id,
              type: req.params.type,
            }));
          }

          res.redirect(app.namedRoutes.build('reassign-before-process.available-pools.get', {
            id: req.params.id,
            type: req.params.type,
            action: req.params.action,
          }));
        }
      ).catch(
        () => {
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
            id: req.params.id,
            type: req.params.type,
            action: req.params.action,
          }));
        }
      );
    };
  };

  module.exports.getReassignBeforeProcessPools = (app) => {
    return (req, res) => {
      const { id } = req.params;
      return requestObj
        .availablePools
        .get(require('request-promise'), app, req.session.authToken, req.session.receivingCourtLocCode)
        .then(async (response) => {
          const court = req.session.courtsList.find(c => c.locationCode === req.session.receivingCourtLocCode);
          const tmpErrors = _.clone(req.session.errors);

          try {
            req.session[`reassignProcessCurrentPool-${id}`] = (await record.get(
              require('request-promise'),
              app,
              req.session.authToken,
              'detail',
              id,
              req.session.locCode,
            )).data.commonDetails.poolNumber;
          } catch (err) {
            app.logger.crit('Failed to fetch the juror\'s current details', {
              auth: req.session.authentication,
              token: req.session.authToken,
              jurorNumber: id,
              error: typeof err.error !== 'undefined' ? err.error : err.toString(),
            });
    
            return res.render('_errors/generic.njk');
          }

          const filteredPools = response.availablePools
              .filter(pool => pool.poolNumber !== req.session[`reassignProcessCurrentPool-${id}`]);

          delete req.session.errors;
          delete req.session.fields;

          app.logger.info('Fetched available pools for reassigning a juror', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              response,
              court,
            },
          });

          return res.render('juror-management/reassign/pools', {
            jurorNumber: req.params['id'],
            backLinkUrl: {
              built: true,
              url: app.namedRoutes.build('reassign-before-process.get', {
                id: req.params.id,
                type: req.params.type,
                action: req.params.action,
              }),
            },
            processUrl: app.namedRoutes.build('reassign-before-process.available-pools.post', {
              id: req.params.id,
              type: req.params.type,
              action: req.params.action,
            }),
            changeCourtUrl: app.namedRoutes.build('reassign-before-process.select-court.get', {
              id: req.params.id,
              type: req.params.type,
              action: req.params.action,
            }),
            pools: filteredPools,
            court,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        )
        .catch((err) => {
          app.logger.crit('Failed to fetch available pools: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locCode: req.session.receivingCourtLocCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        }
        );
    };
  };

  module.exports.postReassignBeforeProcessPools = (app) => {
    return (req, res) => {
      const { id } = req.params;
      const validatorResult = validate(req.body, selectedActivePoolValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('reassign-before-process.available-pools.get', {
          id: req.params.id,
          type: req.params.type,
          action: req.params.action,
        }));
      }

      const payload = {
        jurorNumbers: [req.params['id']],
        receivingCourtLocCode: req.body.poolNumber.substring(0, 3),
        receivingPoolNumber: req.body.poolNumber,
        sourceCourtLocCode: req.session.locCode,
        sourcePoolNumber: req.session[`reassignProcessCurrentPool-${id}`],
      };

      requestObj.reassignJuror
        .put(require('request-promise'), app, req.session.authToken, payload)
        .then(
          () => {
            req.session.locCode = req.session.receivingCourtLocCode;
            delete req.session.receivingCourtLocCode;
            delete req.session[`reassignProcessCurrentPool-${id}`];

            return res.redirect(app.namedRoutes.build(actionPaths(req.params.action, req.params.type), {
              id: req.params.id,
              type: req.params.type,
            }));
          }
        )
        .catch(
          () => {
            app.logger.crit('Failed to reassign the juror to a different pool', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                juror: payload.jurorNumbers,
                newPool: payload.receivingPoolNumber,
              },
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });
            return res.render('_errors/generic');
          }
        );
    };
  };

  module.exports.getReassignBeforeProcessChangeCourt = (app) => {
    return (req, res) => {
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      const cancelUrl = req.params['type'] === 'paper'
        ? app.namedRoutes.build('response.paper.details.get', {
          id: req.params.id,
          type: req.params.type,
        })
        : app.namedRoutes.build('response.detail.get', {
          id: req.params.id,
          type: req.params.type,
        });

      return res.render('pool-management/_common/select-court', {
        currentApp: 'Summons Management',
        submitUrl: app.namedRoutes.build('reassign-before-process.select-court.post', {
          id: req.params.id,
          type: req.params.type,
          action: req.params.action,
        }),
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
  };

  module.exports.postReassignBeforeProcessChangeCourt = (app) => {
    return (req, res) => {
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
        return res.redirect(app.namedRoutes.build('reassign-before-process.select-court.get', {
          id: req.params.id,
          type: req.params.type,
          action: req.params.action,
        }));
      }
      modUtils.matchUserCourt(req.session.courtsList, {
        courtNameOrLocation: courtNameOrLocation,
      }).then(
        (court) => {
          req.session.receivingCourtLocCode = court.locationCode;

          return res.redirect(app.namedRoutes.build('reassign-before-process.available-pools.get', {
            id: req.params.id,
            type: req.params.type,
            action: req.params.action,
          }));
        }
      ).catch(
        () => {
          req.session.errors = {
            courtNameOrLocation: [
              {
                summary: 'Please check the court name or location',
                details: 'This court does not exist. Please enter a name or code of an existing court',
              },
            ],
          };
          return res.redirect(app.namedRoutes.build('reassign-before-process.select-court.get', {
            id: req.params.id,
            type: req.params.type,
            action: req.params.action,
          }));
        }
      );
    };
  };

  module.exports.getReassignBeforeProcessExcusal = (app) => {
    return async(req, res) => {
      try {
        if (!req.session.excusalReasons) {
          req.session.excusalReasons = await systemCodesDAO.get(app, req, 'EXCUSAL_AND_DEFERRAL');

          app.logger.info('Retrieved excusal codes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params['id'],
            type: req.params['type'],
            response: req.session.excusalReasons,
          });
        }

        const tmpErrors = _.clone(req.session.errors),
          tmpFields = req.session.formFields;

        delete req.session.errors;
        delete req.session.formFields;

        const processUrl = app.namedRoutes.build('reassign-before-process.excusal.post', {
            id: req.params.id,
            type: req.params.type,
          }),
          cancelUrl = req.params['type'] === 'paper'
            ? app.namedRoutes.build('response.paper.details.get', {
              id: req.params.id,
              type: req.params.type,
            })
            : app.namedRoutes.build('response.detail.get', {
              id: req.params.id,
              type: req.params.type,
            });

        return res.render('summons-management/excusal', {
          processUrl: processUrl,
          cancelUrl: cancelUrl,
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('process-reply.get', {
              id: req.params.id,
              type: req.params.type,
            }),
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
          jwt: req.session.authToken,
          jurorNumber: req.params['id'],
          type: req.params['type'],
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postReassignBeforeProcessExcusal = (app) => {
    return (req, res) => {
      const validatorResult = validate(req.body, excusalValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('reassign-before-process.excusal.get', {
          id: req.params.id,
          type: req.params.type,
          action: req.params.action,
        }));
      }
      excusalObj.put(
        require('request-promise'),
        app,
        req.session.authToken,
        req.body,
        req.params.id,
        req.params.type
      )
        .then(
          () => {
            app.logger.info('Excusal processed (reassign before process): ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: { body: req.body, jurorNumber: req.params['id'] },
            });

            const codeMessage = (code) => req.session.excusalReasons
                .filter((el) => el.code === code)[0].description,
              reason = {
                REFUSE: 'Excusal refused (' + codeMessage(req.body.excusalCode).toLowerCase() + ')',
                GRANT: 'Excusal granted (' + codeMessage(req.body.excusalCode).toLowerCase() + ')',
              };

            req.session.responseWasActioned = {
              jurorDetails: req.session.replyDetails,
              type: reason[req.body.excusalDecision],
            };

            if (req.body.excusalDecision === 'REFUSE') {
              // if refused we need to offer chance to reassign
              return res.redirect(app.namedRoutes.build('reassign-before-process.get', {
                id: req.params.id,
                type: req.params.type,
                action: 'excused',
              }));
            }

            delete req.session.excusalReasons;

            if (req.params.type === 'paper') {
              return res.redirect(app.namedRoutes.build('response.paper.details.get', req.params));
            }
            return res.redirect(app.namedRoutes.build('response.detail.get', req.params));
          }
        )
        .catch(
          (err) => {
            app.logger.crit('Failed to process excusal (reassign before process): ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: { body: req.body, jurorNumber: req.params['id'] },
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            return res.render('_errors/generic');
          }
        );
    };
  };

  function actionPaths(action, responseType) {
    const actionPaths = {
      responded: 'response.detail.responded.get',
      deferral: 'process-deferral-dates.get',
      excused: responseType === 'paper' ? 'response.paper.details.get' : 'response.detail.get',
    }
    return actionPaths[action];
  }

})();
