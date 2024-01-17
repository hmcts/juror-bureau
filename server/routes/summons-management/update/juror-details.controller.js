(function() {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const modUtils = require('../../../lib/mod-utils');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const digitalReplyObj = require('../../../objects/response-detail').object;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const { changeName: fixNameObj } = require('../../../objects/juror-record');
  const dateFilter = require('../../../components/filters').dateFilter;
  const validate = require('validate.js');
  const validator = require('../../../config/validation/paper-reply');
  const { hasBeenModified, generalError } = require('./summons-update-common');
  const { isCourtUser, isTeamLeader } = require('../../../components/auth/user-type');

  module.exports.getPaper = function(app) {
    return async function(req, res) {
      const postUrl = app.namedRoutes.build('summons.update-details.post', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const cancelUrl = app.namedRoutes.build('response.paper.details.get', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      try {
        const { headers, data } = await paperReplyObj.get(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id']
        );

        const details = _.clone(data);

        Object.assign(details, resolveJurorName(details, req.params['type']));
        details.dateOfBirth = details.dateOfBirth
          ? dateFilter(new Date(details.dateOfBirth), null, 'DD/MM/YYYY')
          : '';

        details.postcode = details.addressPostcode;
        details.address = {
          part1: details.addressLineOne,
          part2: details.addressLineTwo,
          part3: details.addressLineThree,
          part4: details.addressTown,
          part5: details.addressCounty,
        };

        req.session.summonsUpdate = {
          ...req.session.summonsUpdate,
          jurorDetails: {
            title: details.title,
            firstName: details.firstName,
            lastName: details.lastName,
            pendingTitle: details.pendingTitle,
            pendingFirstName: details.pendingFirstName,
            pendingLastName: details.pendingLastName,
          },
          address: {
            ...details.address,
            postcode: details.postcode,
          },
        };

        req.session.summonsUpdate.etag = headers['etag'];

        if (typeof req.session.summonsUpdate.newJurorDetails !== 'undefined') {
          details.title = req.session.summonsUpdate.newJurorDetails.title;
          details.firstName = req.session.summonsUpdate.newJurorDetails.firstName;
          details.lastName = req.session.summonsUpdate.newJurorDetails.lastName;
          req.session.summonsUpdate.jurorDetails = req.session.summonsUpdate.newJurorDetails;

          delete req.session.summonsUpdate.newJurorDetails;
        }

        if (typeof req.session.summonsUpdate.pendingJurorName !== 'undefined') {
          const { title, firstName, lastName } = req.session.summonsUpdate.pendingJurorName;

          details.pendingTitle = title;
          details.pendingFirstName = firstName;
          details.pendingLastName = lastName;

          req.session.summonsUpdate.jurorDetails.pendingTitle = title;
          req.session.summonsUpdate.jurorDetails.pendingFirstName = firstName;
          req.session.summonsUpdate.jurorDetails.pendingLastName = lastName;

          delete req.session.summonsUpdate.pendingJurorName;
        }

        if (typeof req.session.summonsUpdate.newAddress !== 'undefined') {
          details.postcode = req.session.summonsUpdate.newAddress.postcode;
          details.address = req.session.summonsUpdate.newAddress;
          req.session.summonsUpdate.address = req.session.summonsUpdate.newAddress;

          delete req.session.summonsUpdate.newAddress;
        }

        if (details.thirdParty) {
          const thirdPartyReasons = [
            'Deceased',
            'Juror is not there',
            'Juror is unable to reply by themselves',
          ];

          if (!thirdPartyReasons.includes(details.thirdParty.thirdPartyReason)) {
            details.otherThirdPartyReason = true;
          }
        };

        return res.render('summons-management/paper-reply/index.njk', {
          postUrl,
          cancelUrl,
          replyMethod: req.params['type'],
          details,
          noWelsh: true,
          summonType: req.params.type,
          editNameRoute: 'summons.update-details.edit-name.get',
          editAddressRoute: 'summons.update-details.edit-address.get',
          dateMax: dateFilter(moment().subtract(1, 'days'), null, 'DD/MM/YYYY'),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          isCourtUser: isCourtUser(req),
          isTeamLeader: isTeamLeader(req),
        });
      } catch (err) {
        app.logger.crit('Unable to fetch the summons details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            id: req.params['id'],
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.getDigital = function(app) {
    return function(req, res) {
      const postUrl = app.namedRoutes.build('summons.update-details.post', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const cancelUrl = app.namedRoutes.build('response.detail.get', {
        id: req.params['id'],
      });
      const tmpErrors = _.clone(req.session.errors);

      const successCB = function(response) {
          app.logger.info('Fetched juror details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
            },
            response: response,
          });

          const details = _.clone(response);

          delete req.session.errors;

          Object.assign(details, resolveJurorName(details, req.params['type']));

          details.postcode = details.newJurorPostcode;
          details.address = {
            part1: details.newJurorAddress1,
            part2: details.newJurorAddress2,
            part3: details.newJurorAddress3,
            part4: details.newJurorAddress4,
            part5: details.newJurorAddress5,
            part6: details.newJurorAddress6,
          };

          req.session.summonsUpdate = {
            ...req.session.summonsUpdate,
            jurorDetails: {
              title: details.title,
              firstName: details.firstName,
              lastName: details.lastName,
              pendingTitle: details.pendingTitle,
              pendingFirstName: details.pendingFirstName,
              pendingLastName: details.pendingLastName,
            },
            address: {
              ...details.address,
              postcode: details.postcode,
            },
          };

          // need to add etag headers to API obj
          // req.session.summonsUpdate.etag = headers['etag'];

          if (typeof req.session.summonsUpdate.newJurorDetails !== 'undefined') {
            details.title = req.session.summonsUpdate.newJurorDetails.title;
            details.firstName = req.session.summonsUpdate.newJurorDetails.firstName;
            details.lastName = req.session.summonsUpdate.newJurorDetails.lastName;
            req.session.summonsUpdate.jurorDetails = req.session.summonsUpdate.newJurorDetails;

            delete req.session.summonsUpdate.newJurorDetails;
          };

          if (typeof req.session.summonsUpdate.pendingJurorName !== 'undefined') {
            const { title, firstName, lastName } = req.session.summonsUpdate.pendingJurorName;

            details.pendingTitle = title;
            details.pendingFirstName = firstName;
            details.pendingLastName = lastName;

            req.session.summonsUpdate.jurorDetails.pendingTitle = title;
            req.session.summonsUpdate.jurorDetails.pendingFirstName = firstName;
            req.session.summonsUpdate.jurorDetails.pendingLastName = lastName;

            delete req.session.summonsUpdate.pendingJurorName;
          }

          if (typeof req.session.summonsUpdate.newAddress !== 'undefined') {
            details.postcode = req.session.summonsUpdate.newAddress.postcode;
            details.address = req.session.summonsUpdate.newAddress;
            req.session.summonsUpdate.address = req.session.summonsUpdate.newAddress;

            delete req.session.summonsUpdate.newAddress;
          };

          if (details.thirdPartyOtherReason) {
            details.otherThirdPartyReason = true;
          };

          if (details.thirdPartyReason) {
            details.thirdParty.thirdPartyReason = thirdPartyReason;
          };

          details.primaryPhone = details.phoneNumber;
          details.secondaryPhone = details.altPhoneNumber;
          details.emailAddress = details.email;
          details.serviceStartDate = details.poolDate;

          return res.render('summons-management/paper-reply/index.njk', {
            postUrl,
            cancelUrl,
            replyMethod: req.params['type'],
            details,
            noWelsh: true,
            summonType: req.params.type,
            editNameRoute: 'summons.update-details.edit-name.get',
            editAddressRoute: 'summons.update-details.edit-address.get',
            dateMax: dateFilter(moment().subtract(1, 'days'), null, 'DD/MM/YYYY'),
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
            isCourtUser: isCourtUser(req),
            isTeamLeader: isTeamLeader(req),
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Could not fetch juror details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.id,
              body: req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);
        };

      digitalReplyObj
        .get(require('request-promise'), app, req.session.authToken, req.params.id, req.session.hasModAccess)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return async function(req, res) {
      const successPath = req.params['type'] === 'paper' ?
        'response.paper.details.get' :
        'response.detail.get';

      const failPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';

      const validatorResult = validate(req.body, validator.jurorDetails());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('summons.update-details.get', {
          id: req.params['id'],
          type: req.params['type'],
        }));
      }

      const payload = {
        addressLineOne: req.session.summonsUpdate.address.part1,
        addressLineTwo: req.session.summonsUpdate.address.part2,
        addressLineThree: req.session.summonsUpdate.address.part3,
        addressTown: req.session.summonsUpdate.address.part4,
        addressCounty: req.session.summonsUpdate.address.part5,
        addressPostcode: req.session.summonsUpdate.address.postcode,
        ...req.session.summonsUpdate.jurorDetails,
        replyMethod: req.params['type'].toUpperCase(),
      };

      payload.dateOfBirth = dateFilter(req.body.dateOfBirth, 'DD/MM/YYYY', 'YYYY-MM-DD');
      payload.emailAddress = req.body.emailAddress || null;
      payload.primaryPhone = req.body.primaryPhone || null;
      payload.secondaryPhone = req.body.secondaryPhone || null;

      const getReason = () => {
        if (req.body.thirdPartyReason !== 'other') {
          return req.body.thirdPartyReason;
        }

        return req.body.otherDetails;
      };

      payload.thirdParty = {
        relationship: req.body.relationship,
      };
      payload.thirdParty.thirdPartyReason = getReason();

      if (payload.pendingFirstName && payload.pendingLastName) {
        payload.title = payload.pendingTitle;
        payload.firstName = payload.pendingFirstName;
        payload.lastName = payload.pendingLastName;
      }

      const serviceStartDate = moment(req.body.serviceStartDate);
      const ageCheckPath = req.params['type'] === 'paper' ?
        'summons.update-age.get' :
        'summons.update-age-digital.get';
      const ageCheck = modUtils.dateDifference(serviceStartDate, req.body.dateOfBirth, 'years');

      if (ageCheck < 18 || ageCheck > 75) {
        req.session.jurorPaperUpdateAge = ageCheck;
        req.session.jurorPaperUpdateDob = req.body.dateOfBirth;
        req.session.jurorPaperUpdatePayload = payload;

        return res.redirect(app.namedRoutes.build(ageCheckPath, {
          id: req.params['id'],
          type: req.params['type'],
        }));
      };

      try {
        const wasModified = await hasBeenModified(app, req, req.params['type']);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-details.get', {
            id: req.params['id'],
            type: req.params['type'],
          }));
        }

        const jurorUpdateQueue = [];

        jurorUpdateQueue.push(summonsUpdate.patch(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id'],
          'PERSONAL',
          payload,
        ));

        // fix the name with a fix payload
        if (req.session.summonsUpdate.fixedName) {
          jurorUpdateQueue.push(fixNameObj.patch(
            require('request-promise'),
            app,
            req.session.authToken,
            req.params['id'],
            'fix-name',
            req.session.summonsUpdate.fixedName,
          ));
        }

        await Promise.all(jurorUpdateQueue);

        delete req.session.summonsUpdate;

        app.logger.info('Successfully updated the summons juror details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
        });

        return res.redirect(app.namedRoutes.build(successPath, {
          id: req.params['id'],
          type: req.params['type'],
        }));
      } catch (err) {
        app.logger.crit('Unable to update the summons juror details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        generalError(req);

        return res.redirect(app.namedRoutes.build(failPath, {
          id: req.params['id'],
          type: req.params['type'],
        }));
      }
    };
  };

  module.exports.getIneligibleAge = function(app) {
    return function(req, res) {
      const postPath = req.params['type'] === 'paper' ?
        'summons.update-age.post' :
        'summons.update-age-digital.post';
      const backPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';

      return res.render('summons-management/paper-reply/ineligible-age', {
        postUrl: app.namedRoutes.build(postPath, {
          id: req.params['id'],
          type: req.params['type'],
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build(backPath, {
            id: req.params['id'],
            type: req.params['type'],
          }),
        },
        dob: req.session.jurorPaperUpdateDob,
        yearsOld: req.session.jurorPaperUpdateAge,
      });
    };
  };

  module.exports.postIneligibleAge = function(app) {

    return async function(req, res) {
      const payload = req.session.jurorPaperUpdatePayload;
      const successPath = req.params['type'] === 'paper' ?
        'response.paper.details.get' :
        'response.detail.get';
      const failPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';

      try {
        const wasModified = await hasBeenModified(app, req, req.params['type']);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-details.get', {
            id: req.params['id'],
            type: req.params['type'],
          }));
        }

        const jurorUpdateQueue = [];

        jurorUpdateQueue.push(summonsUpdate.patch(
          require('request-promise'),
          app,
          req.session.authToken,
          req.params['id'],
          'PERSONAL',
          payload,
        ));

        // fix the name with a fix payload
        if (req.session.summonsUpdate.fixedName) {
          jurorUpdateQueue.push(fixNameObj.patch(
            require('request-promise'),
            app,
            req.session.authToken,
            req.params['id'],
            'fix-name',
            req.session.summonsUpdate.fixedName,
          ));
        }

        await Promise.all(jurorUpdateQueue);

        delete req.session.summonsUpdate;
        delete req.session.jurorPaperUpdatePayload;

        app.logger.info('Successfully updated the summons juror details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
        });

        return res.redirect(app.namedRoutes.build(successPath, {
          id: req.params['id'],
          type: req.params['type'],
        }));
      } catch (err) {
        app.logger.crit('Unable to update the summons juror details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        generalError(req);

        return res.redirect(app.namedRoutes.build(failPath, {
          id: req.params['id'],
          type: req.params['type'],
        }));
      }
    };
  };

  module.exports.getEditName = function(app) {
    return async function(req, res) {
      const { action } = req.query;
      const postUrl = app.namedRoutes.build('summons.update-details.edit-name.post', {
        id: req.params['id'],
        type: req.params['type'],
      }) + `?action=${action}`;
      const cancelPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';
      const cancelUrl = app.namedRoutes.build(cancelPath, {
        id: req.params['id'],
        type: req.params['type'],
      }) + `?action=${action}`;
      const tmpErrors = _.clone(req.session.errors);
      let jurorDetails;

      delete req.session.errors;

      if (action === 'fix') {
        jurorDetails = {
          title: req.session.summonsUpdate.jurorDetails.title,
          firstName: req.session.summonsUpdate.jurorDetails.firstName,
          lastName: req.session.summonsUpdate.jurorDetails.lastName,
        };
      }

      if (action === 'new') {
        jurorDetails = {
          title: req.session.summonsUpdate.jurorDetails.pendingTitle,
          firstName: req.session.summonsUpdate.jurorDetails.pendingFirstName,
          lastName: req.session.summonsUpdate.jurorDetails.pendingLastName,
        };
      }

      return res.render('summons-management/paper-reply/edit-name.njk', {
        postUrl,
        cancelUrl,
        jurorDetails,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        action,
      });
    };
  };

  module.exports.postEditName = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, validator.jurorName());
      const { action } = req.query;
      const { title, firstName, lastName } = req.body;
      const postPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';

      req.session.summonsUpdate.newJurorDetails = {
        title,
        firstName,
        lastName,
      };

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('summons.update-details.edit-name.get', {
          id: req.params['id'],
          type: req.params['type'],
        }) + `?action=${action}`);
      }

      if (action === 'new') {
        req.session.summonsUpdate.pendingJurorName = {
          title,
          firstName,
          lastName,
        };

        delete req.session.summonsUpdate.newJurorDetails;
      }

      if (action === 'fix') {
        req.session.summonsUpdate.fixedName = {
          title,
          firstName,
          lastName,
        };
      }

      return res.redirect(app.namedRoutes.build(postPath, {
        id: req.params['id'],
        type: req.params['type'],
      }));
    };
  };

  module.exports.getEditAddress = function(app) {
    return async function(req, res) {
      const cancelPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';

      const postUrl = app.namedRoutes.build('summons.update-details.edit-address.post', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const cancelUrl = app.namedRoutes.build(cancelPath, {
        id: req.params['id'],
        type: req.params['type'],
      });
      const address = typeof req.session.summonsUpdate.newAddress !== 'undefined'
        ? req.session.summonsUpdate.newAddress : req.session.summonsUpdate.address;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('summons-management/paper-reply/edit-address.njk', {
        postUrl,
        cancelUrl,
        address,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postEditAddress = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, validator.jurorAddress());
      const redirectPath = req.params['type'] === 'paper' ?
        'summons.update-details.get' :
        'summons.update-details-digital.get';

      req.session.summonsUpdate.newAddress = {
        part1: req.body['address1'],
        part2: req.body['address2'],
        part3: req.body['address3'],
        part4: req.body['address4'],
        part5: req.body['address5'],
        postcode: req.body['postcode'],
      };

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('summons.update-details.edit-address.get', {
          id: req.params['id'],
        }));
      }

      return res.redirect(app.namedRoutes.build(redirectPath, {
        id: req.params['id'],
        type: req.params['type'],
      }));
    };
  };

  function resolveJurorName(response, replyMethod) {
    const pendingName = {
        pendingTitle: replyMethod === 'paper' ? response.title : response.newTitle,
        pendingFirstName: replyMethod === 'paper' ? response.firstName : response.newFirstName,
        pendingLastName: replyMethod === 'paper' ? response.lastName : response.newLastName,
      }
      , currentName = {
        title: replyMethod === 'paper' ? response.existingTitle : response.title,
        firstName: replyMethod === 'paper' ? response.existingFirstName : response.firstName,
        lastName: replyMethod === 'paper' ? response.existingLastName : response.lastName,
      };

    if (Object.values(currentName).join(' ') === Object.values(pendingName).join(' ')) {
      return {
        ...currentName,
      };
    }

    return {
      ...pendingName,
      ...currentName,
    };
  }

})();
