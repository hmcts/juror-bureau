(function() {
  'use strict';

  var _ = require('lodash')
    , moment = require('moment')
    , validate = require('validate.js')
    , modUtils = require('../../../lib/mod-utils')
    , dateFilter = require('../../../components/filters').dateFilter
    , makeDate = require('../../../components/filters').makeDate
    , { isCourtUser, isTeamLeader } = require('../../../components/auth/user-type')
    , excusalCodesObj = require('../../../objects/excusal').object
    , activePoolsObj = require('../../../objects/deferral-mod').deferralPoolsObject
    , changeDeferralObject = require('../../../objects/deferral-mod').changeDeferralObject
    , changeDeferralValidator = require('../../../config/validation/deferral-mod').deferralDateAndReason
    , deferralPoolValidator = require('../../../config/validation/deferral-mod').deferralDateAndPool
    , jurorRecordObject = require('../../../objects/juror-record').record
    , overviewDetailsValidator = require('../../../config/validation/edit-juror-details-mod').overviewDetails
    , extraSupportValidator = require('../../../config/validation/edit-juror-details-mod').extraSupport
    , editJurorDetailsObject = require('../../../objects/juror-record').editDetails
    , deleteDeferralObject = require('../../../objects/deferral-mod').deleteDeferralObject
    , paperReplyValidator = require('../../../config/validation/paper-reply')
    , { changeName: fixNameObj, disqualifyAgeDAO } = require('../../../objects/juror-record');

  module.exports.getEditDeferral = (app) => {
    return (req, res) => {
      excusalCodesObj.get(require('request-promise'), app, req.session.authToken)
        .then((data) => {
          app.logger.info('Retrieved excusal codes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: data,
          });

          let trimmedData = data.filter((reasonObj) => {
              return reasonObj.excusalCode !== 'D'
                && reasonObj.excusalCode !== 'P';
            }),
            tmpErrors = _.clone(req.session.errors);

          delete req.session.errors;

          let selectedDeferralReason = req.session.jurorCommonDetails.excusalCode,
            selectedDeferralDate = dateFilter(
              makeDate(req.session.jurorCommonDetails.deferralDate), null, 'DD/MM/YYYY'
            );

          if (req.session.formFields) {
            if (req.session.formFields.deferralReason !== null) {
              selectedDeferralReason = req.session.formFields.deferralReason;
            };
            if (req.session.formFields.deferralDate !== null) {
              selectedDeferralDate = req.session.formFields.deferralDate;
            };
          }

          if (req.session.deferralDates) {
            selectedDeferralDate = dateFilter(req.session.deferralDates[0], null, 'DD/MM/YYYY');
          }
          if (req.session.newDeferralReason) {
            selectedDeferralReason = req.session.newDeferralReason;
          }

          delete req.session.deferralDates;
          delete req.session.newDeferralReason;

          delete req.session.formFields;

          let minDate = new Date(makeDate(req.session.jurorCommonDetails.startDate)),
            maxDate = moment(minDate).add(12, 'M');

          req.session.minDate = minDate;
          req.session.maxDate = maxDate;

          return res.render('juror-management/edit/juror-edit-deferral', {
            jurorNumber: req.params['jurorNumber'],
            backLinkUrl: {
              built: true,
              url: app.namedRoutes.build('juror-record.overview.get', {
                jurorNumber: req.params['jurorNumber'],
              }),
            },
            processUrl: app.namedRoutes.build('juror-record.deferral-edit.post', {
              jurorNumber: req.params['jurorNumber'],
            }),
            deleteUrl: app.namedRoutes.build('juror-record.deferral-edit-delete.post', {
              jurorNumber: req.params['jurorNumber'],
            }),
            excusalReasons: getExcusalReasons(trimmedData),
            selectedDeferralReason: selectedDeferralReason,
            selectedDeferralDate: selectedDeferralDate,
            minDate: dateFilter(moment(minDate).add(1, 'days'), null, 'DD/MM/YYYY'),
            maxDate: dateFilter(maxDate, null, 'DD/MM/YYYY'),
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch(() => {
          app.logger.crit('Failed to retrive excusal codes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
          });

          return res.render('_errors/generic');
        });
    };
  };

  module.exports.postEditDeferral = (app) => {
    return (req, res) => {
      let validatorResult = validate(req.body, changeDeferralValidator(req.session.minDate, req.session.maxDate));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror-record.deferral-edit.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      let currentDeferralReason = req.session.jurorCommonDetails.excusalCode,
        currentDeferralDate = dateFilter(makeDate(req.session.jurorCommonDetails.deferralDate), null, 'DD/MM/YYYY'),
        deferralReason = req.body.deferralReason,
        deferralDate = req.body.deferralDate;

      if (currentDeferralReason === deferralReason && currentDeferralDate === deferralDate) {
        // No change in reason or date, return to juror record overview.
        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      };

      if (currentDeferralDate === deferralDate) {
        // No change in date, change reason and return to juror record overview.
        deferralDate = dateFilter(deferralDate, 'DD/MM/YYYY', 'YYYY-MM-DD');

        changeDeferralObject.post(require('request-promise'), app, req.session.authToken,
          req.params['jurorNumber'], deferralDate, null, deferralReason)
          .then((data) => {
            app.logger.info('Changed deferral details: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              jurorNumber: req.params['jurorNumber'],
              deferralDate: deferralDate,
              poolNumber: null,
              deferralReason: deferralReason,
              data: data,
            });

            req.session.bannerMessage = {showUpdateOnly: true};

            return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['jurorNumber'],
            }));
          })
          .catch((err) => {
            app.logger.crit('Failed to change deferral details: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                jurorNumber: req.params['jurorNumber'],
                deferralDate: deferralDate,
                excusalReasonCode: deferralReason,
              },
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            return res.render('_errors/generic');
          });
      } else {
        // Change in date, possibly a change in reason, redirect to available pools display.
        req.session.deferralDates = [dateFilter(deferralDate, 'DD/MM/YYYY', 'YYYY-MM-DD')];
        req.session.newDeferralReason = deferralReason;

        return res.redirect(app.namedRoutes.build('juror-record.deferral-edit-confirm.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      };
    };
  };

  module.exports.postDeleteDeferral = (app) => {
    return (req, res) => {
      deleteDeferralObject.delete(require('request-promise'), app, req.session.authToken, req.body.jurorNumber)
        .then(
          () => {
            app.logger.info('Deleted deferral: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              jurorNumber: req.params['jurorNumber'],
            });

            req.session.bannerMessage = 'Responded';

            return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['jurorNumber'],
            }));
          }
        ).catch(
          (err) => {
            app.logger.crit('Failed to delete deferral: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                jurorNumber: req.body.jurorNumber,
              },
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            return res.render('_errors/generic');
          }
        );
    };
  };

  module.exports.getEditDeferralConfirm = (app) => {
    return (req, res) => {
      activePoolsObj.post(require('request-promise'), app, req.session.authToken,
        req.session.deferralDates, req.params['jurorNumber'])
        .then((data) => {
          app.logger.info('Retrieved active pools: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            deferralDate: req.session.deferralDates,
            jurorNumber: req.params['id'],
            data: data,
          });

          let tmpErrors = _.clone(req.session.errors);

          delete req.session.errors;

          let deferralPoolSummary = data.deferralPoolsSummary[0],
            hasActivePools = (() => {
              for (let poolOption of deferralPoolSummary.deferralOptions) {
                if (poolOption.poolNumber !== null) {
                  return true;
                }
              }
              return false;
            })();

          if (hasActivePools) {
            // Trim off any pools which are before the serviceStartDate.
            deferralPoolSummary.deferralOptions = deferralPoolSummary.deferralOptions.filter((pool) => {
              return moment(pool.serviceStartDate).isAfter(moment(req.session.minDate));
            });

            // If no pools left after trimming, redirect to deferral maintenance.
            if (deferralPoolSummary.deferralOptions.length === 0) {
              hasActivePools = false;
            }
          }

          return res.render('juror-management/edit/deferral-available-pools', {
            jurorNumber: req.params['jurorNumber'],
            backLinkUrl: {
              built: true,
              url: app.namedRoutes.build('juror-record.deferral-edit.get', {
                jurorNumber: req.params['jurorNumber'],
              }),
            },
            processUrl: app.namedRoutes.build('juror-record.deferral-edit-confirm.post', {
              jurorNumber: req.params['jurorNumber'],
            }),
            hasActivePools: hasActivePools,
            deferralPoolWeek: deferralPoolSummary,
            selectedDeferralDate: req.session.deferralDates[0],
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch available pools: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              deferralDates: req.session.deferralDates,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');

        });
    };
  };

  module.exports.postEditDeferralConfirm = (app) => {
    return (req, res) => {
      let validatorResult = validate(req.body, deferralPoolValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('juror-record.deferral-edit-confirm.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      // deferralDateAndPool = '{date}_{poolNumber}' or '{date}'
      let deferralSelection = req.body.deferralDateAndPool.split('_'),
        newDeferralDate = deferralSelection[0],
        newPoolNumber = deferralSelection[1]
          ? deferralSelection[1]
          : null;

      changeDeferralObject.post(require('request-promise'), app, req.session.authToken,
        req.params['jurorNumber'], newDeferralDate, newPoolNumber, req.session.newDeferralReason)
        .then(() => {
          app.logger.info('Changed deferral details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params['jurorNumber'],
            deferralDate: newDeferralDate,
            poolNumber: newPoolNumber,
            deferralReason: req.session.newDeferralReason,
          });

          req.session.bannerMessage = 'Responded';

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params['jurorNumber'],
          }));
        })
        .catch((err) => {
          app.logger.crit('Failed to change deferral details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              deferralDate: req.body.deferralDate,
              excusalReasonCode: req.session.newDeferralReason,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

  function getExcusalReasons(arrCodes){
    var sortedCodes = [];

    if (arrCodes){
      sortedCodes = arrCodes.sort(function(a, b) {
        return a.excusalCode.localeCompare(b.excusalCode);
      });
    }

    return sortedCodes;
  }

  module.exports.getEditDetails = (app) => {
    return async(req, res) => {
      let adjustmentReasons = modUtils.adjustmentsReasons,
        reasons = [{value: '', text: 'Select a reason...', selected: true}];

      Object.keys(adjustmentReasons).forEach((key) => {
        reasons.push(
          {
            value: key,
            text: adjustmentReasons[key],
          });
      });

      req.session.dateMax = moment().subtract(1, 'days');

      if (!req.session.editJurorDetails) {
        try {
          const response = await jurorRecordObject.get(require('request-promise'), app, req.session.authToken, 'detail',
            req.params['jurorNumber'], req.session.locCode);

          response.data.dateOfBirth = response.data.dateOfBirth
            ? dateFilter(response.data.dateOfBirth, null, 'DD/MM/YYYY')
            : '';

          response.data.thirdParty = response.data.extraSupport = 'no';

          if (response.data.specialNeed !== null) {
            response.data.extraSupport = 'yes';
          }

          req.session.editJurorEtag = response.headers.etag;
          req.session.editJurorDetails = response.data;

        } catch (err) {
          app.logger.crit('Failed to retrieve juror details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              locCode: req.session.locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        }
      }

      let jurorDetails = req.session.editJurorDetails;

      if (req.session.formFields) {
        req.session.formFields.specialNeed = req.session.formFields.specNeedValue;
        req.session.formFields.specialNeedMessage = req.session.formFields.specNeedMsg;

        Object.assign(jurorDetails, req.session.formFields);

        delete req.session.formFields;
      }

      let tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      if (req.session.editJurorDetails.fixedName) {
        const { title, firstName, lastName } = req.session.editJurorDetails.fixedName;

        req.session.editJurorDetails.commonDetails.title = title;
        req.session.editJurorDetails.commonDetails.firstName = firstName;
        req.session.editJurorDetails.commonDetails.lastName = lastName;
      }

      return res.render('juror-management/edit/juror-edit-details', {
        jurorNumber: req.params['jurorNumber'],
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params['jurorNumber'],
          }),
        },
        processUrl: app.namedRoutes.build('juror-record.details-edit.post', {
          jurorNumber: req.params['jurorNumber'],
        }),
        juror: jurorDetails,
        adjustmentReasons: reasons,
        dateMax: dateFilter(req.session.dateMax, null, 'DD/MM/YYYY'),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        isCourtUser: isCourtUser(req),
        isTeamLeader: isTeamLeader(req),
      });
    };
  };

  module.exports.postEditDetails = (app) => {
    return (req, res) => {
      let validatorResult = validate(req.body, overviewDetailsValidator());

      if (req.body.thirdParty === 'yes') {
        // stubbed - waiting for BE to implement third party for juror record.
      }

      let extraSupportValidatorResult;

      if (req.body.extraSupport === 'yes') {
        extraSupportValidatorResult = validate(req.body, extraSupportValidator());
      } else {
        req.body.specNeedValue = null;
        req.body.specNeedMsg = null;
        req.body.opticReference = null;
      }

      let combinedErrorResult = {};

      Object.assign(combinedErrorResult, validatorResult, extraSupportValidatorResult);

      req.session.formFields = req.body;
      if (Object.keys(combinedErrorResult).length !== 0) {
        req.session.errors = combinedErrorResult;

        return res.redirect(app.namedRoutes.build('juror-record.details-edit.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      const tmpAge = modUtils.dateDifference(
        makeDate(req.session.editJurorDetails.commonDetails.startDate),
        req.body.dateOfBirth,
        'years'
      );

      if (tmpAge < 18 || tmpAge > 75) {
        req.session.jurorAge = tmpAge;

        return res.redirect(app.namedRoutes.build('juror-record.details-edit.ineligible-age.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      // eslint-disable-next-line no-use-before-define
      return processJurorEdit(app, req, res);
    };
  };

  module.exports.getIneligibleAge = function(app) {
    return function(req, res) {
      return res.render('summons-management/paper-reply/ineligible-age', {
        postUrl: app.namedRoutes.build('juror-record.details-edit.ineligible-age.post', {
          jurorNumber: req.params.jurorNumber,
        }),
        backLinkUrl: {
          url: app.namedRoutes.build('juror-record.details-edit.get', {
            jurorNumber: req.params.jurorNumber,
          }),
        },
        dob: req.session.formFields.dateOfBirth,
        yearsOld: modUtils.dateDifference(
          makeDate(req.session.editJurorDetails.commonDetails.startDate),
          req.session.formFields.dateOfBirth,
          'years'
        ),
      });
    };
  };

  module.exports.postIneligibleAge = function(app) {
    return function(req, res) {
      // eslint-disable-next-line no-use-before-define
      return processJurorEdit(app, req, res, true);
    };
  };

  const processJurorEdit = function(app, req, res, disqualifyAge) {
    const requestBody = { ...req.session.formFields };

    delete requestBody.thirdParty;
    delete requestBody.extraSupport;

    requestBody.pendingTitle = req.session.editJurorDetails.commonDetails.pendingTitle;
    requestBody.pendingFirstName = req.session.editJurorDetails.commonDetails.pendingFirstName;
    requestBody.pendingLastName = req.session.editJurorDetails.commonDetails.pendingLastName;

    requestBody.primaryPhone = req.session.formFields.primaryPhone === ''
      ? null
      : req.session.formFields.primaryPhone;
    requestBody.secondaryPhone = req.session.formFields.secondaryPhone === ''
      ? null
      : req.session.formFields.secondaryPhone;
    requestBody.dateOfBirth = dateFilter(req.session.formFields.dateOfBirth, 'DD/MM/YYYY', 'YYYY-MM-DD');
    requestBody.emailAddress = req.session.formFields.emailAddress;
    requestBody.opticReference = req.session.formFields.opticReference === ''
      ? null
      : req.session.formFields.opticReference;

    const promiseArr = [];

    if (req.session.editJurorDetails.fixedName) {
      promiseArr.push(fixNameObj.patch(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['jurorNumber'],
        'fix-name',
        req.session.editJurorDetails.fixedName,
      ));
    }

    promiseArr.push(editJurorDetailsObject.patch(
      require('request-promise'),
      app,
      req.session.authToken,
      requestBody,
      req.params['jurorNumber'],
      req.session.editJurorEtag,
    ));

    if (disqualifyAge) {
      promiseArr.push(disqualifyAgeDAO.patch(app, req, req.params.jurorNumber));
    }

    Promise.all(promiseArr)
      .then(() => {
        app.logger.info('Changed juror details: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          jurorNumber: req.params['jurorNumber'],
          requestBody: requestBody,
        });

        delete req.session.editJurorEtag;
        delete req.session.editJurorDetails;
        delete req.session.dateMax;

        return res.redirect(app.namedRoutes.build('juror-record.details.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      })
      .catch((err) => {
        app.logger.crit('Failed to change juror details: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          etag: req.session.editJurorEtag,
          data: {
            jurorNumber: req.params['jurorNumber'],
            requestBody: requestBody,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      });
  };

  module.exports.getEditDetailsAddress = (app) => {
    return (req, res) => {
      let address = {
          part1: req.session.editJurorDetails.addressLineOne,
          part2: req.session.editJurorDetails.addressLineTwo,
          part3: req.session.editJurorDetails.addressLineThree,
          part4: req.session.editJurorDetails.addressTown,
          part5: req.session.editJurorDetails.addressCounty,
          postcode: req.session.editJurorDetails.addressPostcode,
        },
        tmpErrors = _.clone(req.session.errors);

      if (req.session.formFields) {
        address.part1 = req.session.formFields.address1;
        address.part2 = req.session.formFields.address2;
        address.part3 = req.session.formFields.address3;
        address.part4 = req.session.formFields.address4;
        address.part5 = req.session.formFields.address5;
        address.postcode = req.session.formFields.postcode;

        delete req.session.formFields;
      }

      delete req.session.errors;

      return res.render('summons-management/paper-reply/edit-address', {
        address: address,
        postUrl: app.namedRoutes.build('juror-record.details-edit-address.post', {
          jurorNumber: req.params['jurorNumber'],
        }),
        cancelUrl: app.namedRoutes.build('juror-record.details-edit.get', {
          jurorNumber: req.params['jurorNumber'],
        }),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postEditDetailsAddress = (app) => {
    return (req, res) => {
      let validatorResult = validate(req.body, paperReplyValidator.jurorAddress());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror-record.details-edit-address.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      req.session.editJurorDetails.addressLineOne = req.body.address1;
      req.session.editJurorDetails.addressLineTwo = req.body.address2;
      req.session.editJurorDetails.addressLineThree = req.body.address3;
      req.session.editJurorDetails.addressTown = req.body.address4;
      req.session.editJurorDetails.addressCounty = req.body.address5;
      req.session.editJurorDetails.addressPostcode = req.body.postcode;

      return res.redirect(app.namedRoutes.build('juror-record.details-edit.get', {
        jurorNumber: req.params['jurorNumber'],
      }));
    };
  };

  module.exports.getEditName = (app) => {
    return (req, res) => {
      const { jurorNumber } = req.params;
      const { action } = req.query;
      const postUrl = app.namedRoutes.build('juror-record.details-edit.name.post', {
        jurorNumber,
      }) + `?action=${action}`;
      const cancelUrl = app.namedRoutes.build('juror-record.details-edit.get', {
        jurorNumber,
      });
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      let jurorDetails;

      if (action === 'fix') {
        jurorDetails = {
          title: req.session.editJurorDetails.commonDetails.title,
          firstName: req.session.editJurorDetails.commonDetails.firstName,
          lastName: req.session.editJurorDetails.commonDetails.lastName,
        };
      }

      if (action === 'new') {
        jurorDetails = {
          title: req.session.editJurorDetails.commonDetails.pendingTitle,
          firstName: req.session.editJurorDetails.commonDetails.pendingFirstName,
          lastName: req.session.editJurorDetails.commonDetails.pendingLastName,
        };
      }

      return res.render('summons-management/paper-reply/edit-name.njk', {
        postUrl,
        cancelUrl,
        action,
        jurorDetails,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postEditName = (app) => {
    return (req, res) => {
      const { jurorNumber } = req.params;
      const { action } = req.query;

      const validator = require('../../../config/validation/paper-reply').jurorName
        , validatorResult = validate(req.body, validator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('juror-record.details-edit.name.get', {
          jurorNumber,
        }) + `?action=${action}`);
      }

      const { title, firstName, lastName } = req.body;

      if (action === 'fix') {
        req.session.editJurorDetails.fixedName = {
          title,
          firstName,
          lastName,
        };
      }

      if (action === 'new') {
        req.session.editJurorDetails.commonDetails.pendingTitle = title;
        req.session.editJurorDetails.commonDetails.pendingFirstName = firstName;
        req.session.editJurorDetails.commonDetails.pendingLastName = lastName;
      }

      app.logger.debug('New name added to current juror details', {
        authentication: req.session.authentication,
        token: req.session.authToken,
        data: {
          jurorNumber,
          ...req.body,
        },
      });

      return res.redirect(app.namedRoutes.build('juror-record.details-edit.get', {
        jurorNumber,
      }));
    };
  };

})();
