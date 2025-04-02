(function() {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const validate = require('validate.js');
  const modUtils = require('../../../lib/mod-utils');
  const { dateFilter, makeDate } = require('../../../components/filters');
  const { isCourtUser, isTeamLeader, isBureauUser } = require('../../../components/auth/user-type');
  const { deferralPoolsObject: activePoolsObj, changeDeferralObject, deleteDeferralObject } = require('../../../objects/deferral-mod');
  const { deferralDateAndReason: changeDeferralValidator, deferralDateAndPool: deferralPoolValidator } = require('../../../config/validation/deferral-mod');
  const { record: jurorRecordObject, editDetails: editJurorDetailsObject } = require('../../../objects/juror-record');
  const { overviewDetails: overviewDetailsValidator, extraSupport: extraSupportValidator, thirdParty: thirdPartyValidator } = require('../../../config/validation/edit-juror-details-mod');
  const paperReplyValidator = require('../../../config/validation/paper-reply');
  const { systemCodesDAO } = require('../../../objects/administration');
  const { changeName: fixNameObj, disqualifyAgeDAO } = require('../../../objects/juror-record');
  const { fetchCourts } = require('../../../objects/request-pool');
  const { reassignBeforeProcess } = require('../../../config/validation/reassign-before-process');
  const { courtLocationsFromPostcodeObj } = require('../../../objects/court-location');
  const { resolveCatchmentResponse } = require('../../summons-management/summons-management.controller');
  const courtNameOrLocationValidator = require('../../../config/validation/request-pool').courtNameOrLocation;

  module.exports.getEditDeferral = (app) => {
    return (req, res) => {
      systemCodesDAO.get(req, 'EXCUSAL_AND_DEFERRAL')
        .then((data) => {
          app.logger.info('Retrieved excusal codes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: data,
          });

          let trimmedData = data.filter((reasonObj) => {
              return reasonObj.code !== 'D'
                && reasonObj.code !== 'P';
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
            excusalReasons: trimmedData,
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
        .catch((err) => {
          app.logger.crit('Failed to retrive excusal codes: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
          });

          return res.render('_errors/generic', { err });
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

        changeDeferralObject.post(req, req.params['jurorNumber'], deferralDate, null, deferralReason)
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

            return res.render('_errors/generic', { err });
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
      deleteDeferralObject.delete(req, req.body.jurorNumber)
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

            return res.render('_errors/generic', { err });
          }
        );
    };
  };

  module.exports.getEditDeferralConfirm = (app) => {
    return (req, res) => {
      activePoolsObj.post(req, req.session.deferralDates, req.params['jurorNumber'])
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

          return res.render('_errors/generic', { err });

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

      changeDeferralObject.post(req, req.params['jurorNumber'], newDeferralDate, newPoolNumber, req.session.newDeferralReason)
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
          if (err.statusCode === 422 && err.error?.code === 'CANNOT_DEFER_TO_EXISTING_POOL') {
            app.logger.crit('Failed to change deferral details - cannot add to existing pool: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: req.body,
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });
    
            req.session.errors = makeManualError('deferralDateAndPool', 'You cannot defer into the juror\'s existing pool - please select a different pool or date');
            req.session.formFields = req.body;
            return res.redirect(app.namedRoutes.build('juror-record.deferral-edit-confirm.get', {
              jurorNumber: req.params['jurorNumber'],
            }));
          }
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

          return res.render('_errors/generic', { err });
        });
    };
  };

  module.exports.getEditDetails = (app) => {
    return async(req, res) => {
      const { jurorNumber } = req.params;

      if (req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails) {
        if (jurorNumber != req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails?.jurorNumber) {
          app.logger.crit('Juror number does not match cached data', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: {
                url: jurorNumber,
                cached: req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails?.jurorNumber,
              },
            },
          });
          return res.render('_errors/data-mismatch');
        }
      }

      req.session.dateMax = moment().subtract(1, 'days');

      try {
        let adjustmentReasonsObj = modUtils.reasonsArrToObj(await systemCodesDAO.get(
            req, 'REASONABLE_ADJUSTMENTS')),
          reasons = [{value: '', text: 'Select a reason...', selected: true}];

        Object.keys(adjustmentReasonsObj).forEach((key) => {
          reasons.push(
            {
              value: key,
              text: adjustmentReasonsObj[key],
            });
        });

        if (!req.session[`editJurorDetails-${jurorNumber}`]) {
          const response = await jurorRecordObject.get(
            req, 
            'detail',
            req.params['jurorNumber'], 
            req.session.locCode
          );

          response.data.dateOfBirth = response.data.dateOfBirth
            ? dateFilter(response.data.dateOfBirth, null, 'DD/MM/YYYY')
            : '';

          if (response.data.specialNeed !== null) {
            response.data.extraSupport = 'yes';
          }

          req.session[`editJurorEtag-${response.data.commonDetails.jurorNumber}`] = response.headers.etag;
          req.session[`editJurorDetails-${response.data.commonDetails.jurorNumber}`] = response.data;

        }

        let jurorDetails = req.session[`editJurorDetails-${jurorNumber}`]

        if (req.session.formFields) {
          req.session.formFields.specialNeed = req.session.formFields.specNeedValue;
          req.session.formFields.specialNeedMessage = req.session.formFields.specNeedMsg;

          Object.assign(jurorDetails, req.session.formFields);

          if (req.session.formFields['thirdPartyEnabled'] == 'yes' && jurorDetails.thirdParty == null) {
            jurorDetails.thirdParty = {};
          }
          if (req.session.formFields['thirdParty-first-name']) {
            jurorDetails.thirdParty.thirdPartyFName = req.session.formFields['thirdParty-first-name'];
          }
          if (req.session.formFields['thirdParty-last-name']) {
            jurorDetails.thirdParty.thirdPartyLName = req.session.formFields['thirdParty-last-name'];
          }
          if (req.session.formFields['thirdParty-relation']) {
            jurorDetails.thirdParty.relationship = req.session.formFields['thirdParty-relation'];
          }
          if (req.session.formFields['thirdParty-mainPhone']) {
            jurorDetails.thirdParty.mainPhone = req.session.formFields['thirdParty-mainPhone'];
          }
          if (req.session.formFields['thirdParty-secPhone']) {
            jurorDetails.thirdParty.otherPhone = req.session.formFields['thirdParty-secPhone'];
          }
          if (req.session.formFields['thirdParty-email']) {
            jurorDetails.thirdParty.emailAddress = req.session.formFields['thirdParty-email'];
          }
          if (req.session.formFields['thirdParty-reason']) {
            jurorDetails.thirdParty.thirdPartyReason = req.session.formFields['thirdParty-reason'];
          }

          const thirdPartyDetails = Array.isArray(req.session.formFields['thirdParty-contact-preferences'])
            ? req.session.formFields['thirdParty-contact-preferences']
            : [req.session.formFields['thirdParty-contact-preferences']];

          if (thirdPartyDetails.includes('contact-juror-by-email')) {
            jurorDetails.thirdParty.useJurorEmailDetails = true;
          }
          if (thirdPartyDetails.includes('contact-juror-by-phone')) {
            jurorDetails.thirdParty.useJurorPhoneDetails = true;
          }
          delete req.session.formFields;
        }

        let tmpErrors = _.clone(req.session.errors);

        delete req.session.errors;

        if (req.session[`editJurorDetails-${jurorNumber}`].fixedName) {
          const { title, firstName, lastName } = req.session[`editJurorDetails-${jurorNumber}`].fixedName;

          req.session[`editJurorDetails-${jurorNumber}`].commonDetails.title = title;
          req.session[`editJurorDetails-${jurorNumber}`].commonDetails.firstName = firstName;
          req.session[`editJurorDetails-${jurorNumber}`].commonDetails.lastName = lastName;
        }

        if (req.url.includes('bank-details/address')) {
          const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
          const { locCode } = req.params;

          return res.redirect(app.namedRoutes.build(`${routePrefix}.bank-details.address-edit.get`, {
            jurorNumber: req.params['jurorNumber'],
            locCode,
          }));
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

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postEditDetails = (app) => {
    return (req, res) => {
      const { jurorNumber } = req.params;
      let validatorResult = validate(req.body, overviewDetailsValidator());

      if (!req.session[`editJurorDetails-${jurorNumber}`]) {
        return res.render('_errors/generic', { err });
      }

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

      let thirdPartyValidatorResult;
      if (req.body.thirdPartyEnabled === 'yes') {
        thirdPartyValidatorResult = validate(req.body, thirdPartyValidator());
      } else {
        req.body.thirdParty = null;
        req.body['thirdParty-first-name'] = null;
        req.body['thirdParty-last-name'] = null;
        req.body['thirdParty-relation'] = null;
        req.body['thirdParty-mainPhone'] = null;
        req.body['thirdParty-secPhone'] = null;
        req.body['thirdParty-email'] = null;
        req.body['thirdParty-reason'] = null;
      }

      let combinedErrorResult = {};

      Object.assign(combinedErrorResult, validatorResult, extraSupportValidatorResult, thirdPartyValidatorResult);

      req.session.formFields = req.body;
      if (Object.keys(combinedErrorResult).length !== 0) {
        req.session.errors = combinedErrorResult;

        return res.redirect(app.namedRoutes.build('juror-record.details-edit.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      const tmpAge = modUtils.dateDifference(
        makeDate(req.session[`editJurorDetails-${jurorNumber}`].commonDetails.startDate),
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
      const { jurorNumber } = req.params;

      return res.render('summons-management/paper-reply/ineligible-age', {
        postUrl: app.namedRoutes.build('juror-record.details-edit.ineligible-age.post', {
          jurorNumber,
        }),
        backLinkUrl: {
          url: app.namedRoutes.build('juror-record.details-edit.get', {
            jurorNumber,
          }),
        },
        dob: req.session.formFields.dateOfBirth,
        yearsOld: modUtils.dateDifference(
          makeDate(req.session[`editJurorDetails-${jurorNumber}`].commonDetails.startDate),
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

  const processJurorEdit = async function(app, req, res, disqualifyAge) {
    const { jurorNumber } = req.params;
    const requestBody = { ...req.session.formFields };
    let successUrl = app.namedRoutes.build('juror-record.details.get', {
      jurorNumber: req.params.jurorNumber,
    });

    if (req.url.includes('bank-details')){
      const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
      const { locCode } = req.params;

      successUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
        jurorNumber: req.params['jurorNumber'],
        locCode,
      });
    }

    if(requestBody.thirdPartyEnabled === 'yes') {
      const thirdPartyDetails = Array.isArray(requestBody['thirdParty-contact-preferences'])
        ? requestBody['thirdParty-contact-preferences']
        : [requestBody['thirdParty-contact-preferences']];

      requestBody.thirdParty = {
        firstName: requestBody['thirdParty-first-name'],
        lastName: requestBody['thirdParty-last-name'],
        relationship: requestBody['thirdParty-relation'],
        mainPhone: requestBody['thirdParty-mainPhone'],
        otherPhone: requestBody['thirdParty-secPhone'],
        emailAddress: requestBody['thirdParty-email'],
        reason: requestBody['thirdParty-reason'],
        contactJurorByPhone: thirdPartyDetails.includes('contact-juror-by-phone'),
        contactJurorByEmail: thirdPartyDetails.includes('contact-juror-by-email'),
      }
    }

    delete requestBody.thirdPartyEnabled;
    delete requestBody['thirdParty-first-name'];
    delete requestBody['thirdParty-last-name'];
    delete requestBody['thirdParty-relation'];
    delete requestBody['thirdParty-mainPhone'];
    delete requestBody['thirdParty-secPhone'];
    delete requestBody['thirdParty-email'];
    delete requestBody['thirdParty-reason'];
    delete requestBody['thirdParty-contact-preferences'];
    delete requestBody.extraSupport;

    requestBody.pendingTitle = req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingTitle;
    requestBody.pendingFirstName = req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingFirstName;
    requestBody.pendingLastName = req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingLastName;

    requestBody.primaryPhone = req.session.formFields.primaryPhone === ''
      ? null
      : req.session.formFields.primaryPhone;
    requestBody.secondaryPhone = req.session.formFields.secondaryPhone === ''
      ? null
      : req.session.formFields.secondaryPhone;
    requestBody.dateOfBirth = req.session.formFields.dateOfBirth
      ? dateFilter(req.session.formFields.dateOfBirth, 'DD/MM/YYYY', 'YYYY-MM-DD')
      : null;
    requestBody.emailAddress = req.session.formFields.emailAddress;
    requestBody.opticReference = req.session.formFields.opticReference === ''
      ? null
      : req.session.formFields.opticReference;
    requestBody.livingOverseas = req.session.formFields.livingOverseas === 'yes';

    const promiseArr = [];

    if (req.session[`editJurorDetails-${jurorNumber}`].fixedName) {
      try {
        await fixNameObj.patch(
          req,
          req.params['jurorNumber'],
          'fix-name',
          req.session[`editJurorDetails-${jurorNumber}`].fixedName,
        );
      } catch (err) {
        app.logger.crit('Failed to fix current name: ', {
          auth: req.session.authentication,
          data: req.session[`editJurorDetails-${jurorNumber}`].fixedName,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    }

    try {
      await editJurorDetailsObject.patch(
        req,
        requestBody,
        req.params['jurorNumber'],
        req.session[`editJurorEtag-${jurorNumber}`],
      );
    } catch (err) {
      app.logger.crit('Failed to change juror details: ', {
        auth: req.session.authentication,
        data: { jurorNumber: req.params['jurorNumber'], requestBody },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    app.logger.info('Changed juror details: ', {
      auth: req.session.authentication,
      data: { jurorNumber: req.params['jurorNumber'], requestBody: requestBody },
    });

    delete req.session[`editJurorEtag-${jurorNumber}`];
    delete req.session[`editJurorDetails-${jurorNumber}`];
    delete req.session.dateMax;
    delete req.session.formFields;

    if (disqualifyAge) {
      try {
        await disqualifyAgeDAO.patch(req, req.params.jurorNumber);

        app.logger.info('Disqualified juror due to age: ', {
          auth: req.session.authentication,
          data: { jurorNumber: req.params['jurorNumber'] },
        });
      } catch (err) {
        app.logger.crit('Failed to disqualify juror due to age: ', {
          auth: req.session.authentication,
          data: { jurorNumber: req.params['jurorNumber'] },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        // if the disqulification fails, we allow to go through and show the updated details
      }
    }

    if (isBureauUser(req, res)) {
      const postcode = modUtils.splitPostCode(requestBody.addressPostcode);
      try {
        const catchmentResponse = await courtLocationsFromPostcodeObj.get(req, postcode);

        const catchmentAreas = resolveCatchmentResponse(catchmentResponse, req.session.locCode);

        if (catchmentAreas.isOutwithCatchment) {
          req.session[`editJurorDetails-${jurorNumber}-reassign`] = {
            catchmentAreas: catchmentAreas,
          };

          return res.redirect(app.namedRoutes.build('juror-record.details-edit.reassign.select-court.get', { jurorNumber }));
        }
      } catch (err) {
        // NO CATCHEMENT AREA FOR NEW POSTCODE
        if (err.statusCode === 404) {
          req.session[`editJurorDetails-${jurorNumber}-reassign`] = {
            catchmentAreas: resolveCatchmentResponse([], req.session.locCode),
          };

          return res.redirect(app.namedRoutes.build('juror-record.details-edit.reassign.select-court.get', { jurorNumber }));
        }
        app.logger.crit('Failed to retrieve court location from postcode: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            postcode: postcode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
        return res.render('_errors/generic');
      }
    }

    return res.redirect(successUrl);
  };

  module.exports.getEditDetailsAddress = (app) => {
    return (req, res) => {
      const { jurorNumber } = req.params;
      let postUrl, cancelUrl,
        tmpErrors = _.clone(req.session.errors);
  
      if (req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails) {
        if (jurorNumber != req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails?.jurorNumber) {
          app.logger.crit('Juror number does not match cached data', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: {
                url: jurorNumber,
                cached: req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails?.jurorNumber,
              },
            },
          });
          return res.render('_errors/data-mismatch');
        }
      }

      const address = {
        part1: req.session[`editJurorDetails-${jurorNumber}`].addressLineOne,
        part2: req.session[`editJurorDetails-${jurorNumber}`].addressLineTwo,
        part3: req.session[`editJurorDetails-${jurorNumber}`].addressLineThree,
        part4: req.session[`editJurorDetails-${jurorNumber}`].addressTown,
        part5: req.session[`editJurorDetails-${jurorNumber}`].addressCounty,
        postcode: req.session[`editJurorDetails-${jurorNumber}`].addressPostcode,
      };
      let saveBtnLabel;
      if (req.url.includes('bank-details')) {
        saveBtnLabel = 'Save';
        const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
        const { locCode } = req.params;

        postUrl = app.namedRoutes.build(`${routePrefix}.bank-details.address-edit.post`, {
          jurorNumber: req.params['jurorNumber'],
          locCode,
        });
        cancelUrl = app.namedRoutes.build(`${routePrefix}.bank-details.get`, {
          jurorNumber: req.params['jurorNumber'],
          locCode,
        });
      } else {
        saveBtnLabel = 'Review Edit';
        postUrl = app.namedRoutes.build('juror-record.details-edit-address.post', {
          jurorNumber: req.params['jurorNumber'],
        });
        cancelUrl = app.namedRoutes.build('juror-record.details-edit.get', {
          jurorNumber: req.params['jurorNumber'],
        });
      }

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
        postUrl,
        cancelUrl,
        saveBtnLabel: saveBtnLabel,
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
      const { jurorNumber } = req.params;
      let validatorResult = validate(req.body, paperReplyValidator.jurorAddress());

      let formErrorUrl = app.namedRoutes.build('juror-record.details-edit-address.get', {
        jurorNumber: req.params['jurorNumber'],
      });

      if (req.url.includes('bank-details')){
        const routePrefix = req.url.includes('record') ? 'juror-record' : 'juror-management';
        const { locCode } = req.params;

        formErrorUrl = app.namedRoutes.build(`${routePrefix}.bank-details.address-edit.get`, {
          jurorNumber: req.params['jurorNumber'],
          locCode,
        });
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(formErrorUrl);
      }

      req.session[`editJurorDetails-${jurorNumber}`].addressLineOne = req.body.address1;
      req.session[`editJurorDetails-${jurorNumber}`].addressLineTwo = req.body.address2;
      req.session[`editJurorDetails-${jurorNumber}`].addressLineThree = req.body.address3;
      req.session[`editJurorDetails-${jurorNumber}`].addressTown = req.body.address4;
      req.session[`editJurorDetails-${jurorNumber}`].addressCounty = req.body.address5;
      req.session[`editJurorDetails-${jurorNumber}`].addressPostcode = req.body.postcode;

      // If only changing address then resend the data given from original API call
      if (req.url.includes('bank-details')) {
        const body = {
          specNeedValue: req.session[`editJurorDetails-${jurorNumber}`].specialNeed,
          specNeedMsg: req.session[`editJurorDetails-${jurorNumber}`].specialNeedMessage,
          title: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.title,
          firstName: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.firstName,
          lastName: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.lastName,
          ...req.session[`editJurorDetails-${jurorNumber}`],
        };

        delete body.commonDetails;
        delete body.specialNeed;
        delete body.specialNeedMessage;

        req.session.formFields = body;

        return processJurorEdit(app, req, res);
      }

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

      if (req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails) {
        if (jurorNumber != req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails?.jurorNumber) {
          app.logger.crit('Juror number does not match cached data', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: {
                url: jurorNumber,
                cached: req.session[`editJurorDetails-${jurorNumber}`]?.commonDetails?.jurorNumber,
              },
            },
          });
          return res.render('_errors/data-mismatch');
        }
      }

      if (action === 'fix') {
        jurorDetails = {
          title: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.title,
          firstName: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.firstName,
          lastName: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.lastName,
        };
      }

      if (action === 'new') {
        jurorDetails = {
          title: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingTitle,
          firstName: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingFirstName,
          lastName: req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingLastName,
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

      const title = req.body.title.trim();
      const firstName = req.body.firstName.trim();
      const lastName = req.body.lastName.trim();

      if (action === 'fix') {
        req.session[`editJurorDetails-${jurorNumber}`].fixedName = {
          title,
          firstName,
          lastName,
        };
      }

      if (action === 'new') {
        req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingTitle = title;
        req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingFirstName = firstName;
        req.session[`editJurorDetails-${jurorNumber}`].commonDetails.pendingLastName = lastName;
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

  module.exports.getReassignCatchmentSelectCourt = (app) => {
    return async(req, res) => {
      const { jurorNumber } = req.params;
      const catchmentAreas = req.session[`editJurorDetails-${jurorNumber}-reassign`].catchmentAreas;
      delete req.session.receivingCourtLocCode;

      try {
        // Only fetch courts list if not known.
        if (!req.session.courtsList || !req.session.transformedCourtsList) {
          try {
            const { courts } = await fetchCourts.get(req);

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
        const currentCourt = req.session.courtsList.find(elem => elem.locationCode === catchmentAreas.currentLocationCode);

        currentCourt.formattedName = modUtils.transformCourtName(currentCourt);

        const tmpErrors = _.clone(req.session.errors),
          tmpFields = req.session.formFields;

        delete req.session.errors;
        delete req.session.formFields;

        return res.render('summons-management/process-reply/reassign-before-process',
          {
            jurorNumber,
            processUrl: app.namedRoutes.build('juror-record.details-edit.reassign.select-court.post', {
              jurorNumber,
            }),
            jurorDetailsEdit: true,
            catchmentWarning: catchmentAreas,
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

  module.exports.postReassignCatchmentSelectCourt = (app) => {
    return async (req, res) => {
      const { jurorNumber } = req.params;
      let validatorResult = validate(req.body, reassignBeforeProcess());

      if (typeof validatorResult === 'undefined' && req.body.selectCourt === 'differentCourt') {
        validatorResult = validate(req.body, courtNameOrLocationValidator());
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror-record.details-edit.reassign.select-court.get', {
          jurorNumber
        }));
      }

      let court = {};
      if (req.body.selectCourt !== 'differentCourt') {
        if (req.body.selectCourt === req.session[`editJurorDetails-${jurorNumber}-reassign`].catchmentAreas.currentLocationCode) {
          delete req.session[`editJurorDetails-${jurorNumber}-reassign`];

          return res.redirect(app.namedRoutes.build('juror-record.details.get', {
            jurorNumber
          }));
        } else {
          court.locationCode = req.body.selectCourt;
        }
      } else {
        try {
          court = await modUtils.matchUserCourt(req.session.courtsList, {
            courtNameOrLocation: req.body.courtNameOrLocation,
          });
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
          
          return res.redirect(app.namedRoutes.build('juror-record.details-edit.reassign.select-court.get', {
            jurorNumber,
          }));
        }
      }

      req.session.receivingCourtLocCode = court.locationCode;
  
      return res.redirect(app.namedRoutes.build('juror-record.details-edit.reassign.select-pool.get', {
        jurorNumber,
      }));
    };
  };

})();
