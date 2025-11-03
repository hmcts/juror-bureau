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

  module.exports.getPaper = (app) => async (req, res) => {
    const { id, type } = req.params;
    const postUrl = app.namedRoutes.build('summons.update-details.post', { id, type });
    const cancelUrl = app.namedRoutes.build('response.paper.details.get', { id, type });
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    try {
      const { headers, data } = await paperReplyObj.get(req, id);

      const details = _.clone(data);

      Object.assign(details, resolveJurorName(details, type));
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

      req.session[`summonsUpdate-${id}`] = {
        ...req.session[`summonsUpdate-${id}`],
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

      req.session[`summonsUpdate-${id}`].etag = headers['etag'];

      if (typeof req.session[`summonsUpdate-${id}`].newJurorDetails !== 'undefined') {
        details.title = req.session[`summonsUpdate-${id}`].newJurorDetails.title;
        details.firstName = req.session[`summonsUpdate-${id}`].newJurorDetails.firstName;
        details.lastName = req.session[`summonsUpdate-${id}`].newJurorDetails.lastName;
        req.session[`summonsUpdate-${id}`].jurorDetails = req.session[`summonsUpdate-${id}`].newJurorDetails;

        delete req.session[`summonsUpdate-${id}`].newJurorDetails;
      }

      if (typeof req.session[`summonsUpdate-${id}`].pendingJurorName !== 'undefined') {
        const { title, firstName, lastName } = req.session[`summonsUpdate-${id}`].pendingJurorName;

        details.pendingTitle = title;
        details.pendingFirstName = firstName;
        details.pendingLastName = lastName;

        req.session[`summonsUpdate-${id}`].jurorDetails.pendingTitle = title;
        req.session[`summonsUpdate-${id}`].jurorDetails.pendingFirstName = firstName;
        req.session[`summonsUpdate-${id}`].jurorDetails.pendingLastName = lastName;

        delete req.session[`summonsUpdate-${id}`].pendingJurorName;
      }

      if (typeof req.session[`summonsUpdate-${id}`].newAddress !== 'undefined') {
        req.session[`summonsUpdate-${id}`].address = req.session[`summonsUpdate-${id}`].newAddress;
        const newAddress = _.clone(req.session[`summonsUpdate-${id}`].newAddress);

        details.addressLineOne = newAddress.part1;
        details.addressLineTwo = newAddress.part2;
        details.addressLineThree = newAddress.part3;
        details.addressLineTown = newAddress.part4;
        details.addressLineCounty = newAddress.part5;
        details.addressPostcode = newAddress.postcode;

        delete req.session[`summonsUpdate-${id}`].newAddress;
      }

      let isThirdPartyResponse = false;
      if (details.thirdParty) {
        isThirdPartyResponse = !(details.thirdParty.relationship === '' || details.thirdParty.relationship === null)
          || !(details.thirdParty.thirdPartyReason === '' || details.thirdParty.thirdPartyReason === null)
          || !(details.thirdParty.thirdPartyFName === '' || details.thirdParty.thirdPartyFName === null)
          || !(details.thirdParty.thirdPartyLName === '' || details.thirdParty.thirdPartyLName === null)
          || !(details.thirdParty.thirdPartyPhone === '' || details.thirdParty.thirdPartyPhone === null)
          || !(details.thirdParty.thirdPartyEmail === '' || details.thirdParty.thirdPartyEmail === null)
          || !(details.thirdParty.otherPhone === '' || details.thirdParty.otherPhone === null);

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
        replyMethod: type,
        details,
        noWelsh: true,
        summonType: type,
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
        isThirdPartyResponse,
      });
    } catch (err) {
      app.logger.crit('Unable to fetch the summons details', {
        auth: req.session.authentication,
        data: {
          id,
        },
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    };
  };

  module.exports.getDigital = (app) => async (req, res) =>{
    const { id, type } = req.params;
    const postUrl = app.namedRoutes.build('summons.update-details.post', { id, type });
    const cancelUrl = app.namedRoutes.build('response.detail.get', { id });
    const tmpErrors = _.clone(req.session.errors);

    let response;
    try {
      response = await digitalReplyObj.get(req, req.params.id, req.session.hasModAccess);
    } catch (err) {
      app.logger.crit('Could not fetch juror details: ', {
        auth: req.session.authentication,
        data: {
          id,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.status(err.statusCode).send(err.error);
    }

    app.logger.info('Fetched juror details: ', {
      auth: req.session.authentication,
      data: {
        id,
      },
      response,
    });

    const details = _.clone(response);

    delete req.session.errors;

    Object.assign(details, resolveJurorName(details, type));

    details.postcode = details.newJurorPostcode;
    details.address = {
      part1: details.newJurorAddress1,
      part2: details.newJurorAddress2,
      part3: details.newJurorAddress3,
      part4: details.newJurorAddress4,
      part5: details.newJurorAddress5,
      part6: details.newJurorAddress6,
    };

    req.session[`summonsUpdate-${id}`] = {
      ...req.session[`summonsUpdate-${id}`],
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

    if (typeof req.session[`summonsUpdate-${id}`].newJurorDetails !== 'undefined') {
      details.title = req.session[`summonsUpdate-${id}`].newJurorDetails.title;
      details.firstName = req.session[`summonsUpdate-${id}`].newJurorDetails.firstName;
      details.lastName = req.session[`summonsUpdate-${id}`].newJurorDetails.lastName;
      req.session[`summonsUpdate-${id}`].jurorDetails = req.session[`summonsUpdate-${id}`].newJurorDetails;

      delete req.session[`summonsUpdate-${id}`].newJurorDetails;
    };

    if (typeof req.session[`summonsUpdate-${id}`].pendingJurorName !== 'undefined') {
      const { title, firstName, lastName } = req.session[`summonsUpdate-${id}`].pendingJurorName;

      details.pendingTitle = title;
      details.pendingFirstName = firstName;
      details.pendingLastName = lastName;

      req.session[`summonsUpdate-${id}`].jurorDetails.pendingTitle = title;
      req.session[`summonsUpdate-${id}`].jurorDetails.pendingFirstName = firstName;
      req.session[`summonsUpdate-${id}`].jurorDetails.pendingLastName = lastName;

      delete req.session[`summonsUpdate-${id}`].pendingJurorName;
    }

    if (typeof req.session[`summonsUpdate-${id}`].newAddress !== 'undefined') {
      details.postcode = req.session[`summonsUpdate-${id}`].newAddress.postcode;
      details.address = req.session[`summonsUpdate-${id}`].newAddress;
      req.session[`summonsUpdate-${id}`].address = req.session[`summonsUpdate-${id}`].newAddress;

      delete req.session[`summonsUpdate-${id}`].newAddress;
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
      replyMethod: type,
      details,
      noWelsh: true,
      summonType: type,
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
  };

  module.exports.post = (app) => async (req, res) => {
    const { id, type } = req.params;
    const successPath = type === 'paper' ?
      'response.paper.details.get' :
      'response.detail.get';
    const failPath = type === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';

    const validatorResult = validate(req.body, validator.jurorDetails());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('summons.update-details.get', { id, type }));
    }

    const payload = {
      addressLineOne: req.session[`summonsUpdate-${id}`].address.part1,
      addressLineTwo: req.session[`summonsUpdate-${id}`].address.part2,
      addressLineThree: req.session[`summonsUpdate-${id}`].address.part3,
      addressTown: req.session[`summonsUpdate-${id}`].address.part4,
      addressCounty: req.session[`summonsUpdate-${id}`].address.part5,
      addressPostcode: req.session[`summonsUpdate-${id}`].address.postcode,
      ...req.session[`summonsUpdate-${id}`].jurorDetails,
      replyMethod: req.params['type'].toUpperCase(),
    };

    payload.dateOfBirth = req.body.dateOfBirth !== '' ? dateFilter(req.body.dateOfBirth, 'DD/MM/YYYY', 'YYYY-MM-DD') : null;
    payload.emailAddress = req.body.emailAddress || null;
    payload.primaryPhone = req.body.primaryPhone || null;
    payload.secondaryPhone = req.body.secondaryPhone || null;

    const getReason = () => {
      if (req.body.thirdPartyReason !== 'other') {
        return req.body.thirdPartyReason;
      }

      return req.body.otherDetails;
    };

    payload.thirdParty = {};
    // build thirdParty Object if any detail in the relationship field
    if (req.body.thirdPartyEnabled === 'yes') {
      const validatorResult = validate(req.body, validator.thirdParty());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('summons.update-details.get', { id, type }));
      }
      // build thirdParty Object if any detail in the relationship field
      payload.thirdParty.relationship = req.body.relationship;
      payload.thirdParty.thirdPartyReason = getReason();
      payload.thirdParty.thirdPartyFName = req.body.thirdPartyFName;
      payload.thirdParty.thirdPartyLName = req.body.thirdPartyLName;
      payload.thirdParty.thirdPartyPhone = req.body.thirdPartyMainPhone;
      payload.thirdParty.otherPhone = req.body.thirdPartyOtherPhone;
      payload.thirdParty.thirdPartyEmail = req.body.thirdPartyEmailAddress;
      payload.thirdParty.useJurorEmailDetails = req.body.thirdPartyContactPreferences?.includes('useJurorEmailDetails') ? true : false;
      payload.thirdParty.useJurorPhoneDetails = req.body.thirdPartyContactPreferences?.includes('useJurorPhoneDetails') ? true : false;
    }

    if (payload.pendingFirstName && payload.pendingLastName) {
      payload.title = payload.pendingTitle;
      payload.firstName = payload.pendingFirstName;
      payload.lastName = payload.pendingLastName;
    }

    const serviceStartDate = moment(req.body.serviceStartDate);
    const ageCheckPath = type === 'paper' ?
      'summons.update-age.get' :
      'summons.update-age-digital.get';
    const ageCheck = modUtils.dateDifference(serviceStartDate, req.body.dateOfBirth, 'years');

    if (ageCheck < 18 || ageCheck > 75) {
      req.session.jurorPaperUpdateAge = ageCheck;
      req.session.jurorPaperUpdateDob = req.body.dateOfBirth;
      req.session.jurorPaperUpdatePayload = payload;

      return res.redirect(app.namedRoutes.build(ageCheckPath, { id, type }));
    };

    try {
      const wasModified = await hasBeenModified(app, req, type);

      if (wasModified) {
        return res.redirect(app.namedRoutes.build('summons.update-details.get', { id, type }));
      }

      if (req.session[`summonsUpdate-${id}`].fixedName) {
        await fixNameObj.patch(
          req,
          id,
          'fix-name',
          req.session[`summonsUpdate-${id}`].fixedName,
        );
      }

      await summonsUpdate.patch(
        req,
        id,
        'PERSONAL',
        payload,
      );

      delete req.session[`summonsUpdate-${id}`];

      app.logger.info('Successfully updated the summons juror details', {
        auth: req.session.authentication,
        data: { id },
      });

      return res.redirect(app.namedRoutes.build(successPath, { id, type }));
    } catch (err) {
      app.logger.crit('Unable to update the summons juror details', {
        auth: req.session.authentication,
        data: { id },
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      generalError(req);

      return res.redirect(app.namedRoutes.build(failPath, { id, type }));
    }
  };

  module.exports.getIneligibleAge = (app) => (req, res) => {
    const { id, type } = req.params;
    const postPath = type === 'paper' ?
      'summons.update-age.post' :
      'summons.update-age-digital.post';
    const backPath = type === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';

    return res.render('summons-management/paper-reply/ineligible-age', {
      postUrl: app.namedRoutes.build(postPath, { id, type }),
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build(backPath, { id, type }),
      },
      dob: req.session.jurorPaperUpdateDob,
      yearsOld: req.session.jurorPaperUpdateAge,
    });
  };

  module.exports.postIneligibleAge = (app) => async (req, res) => {
    const { id, type }= req.params;
    const payload = req.session.jurorPaperUpdatePayload;
    const successPath = type === 'paper' ?
      'response.paper.details.get' :
      'response.detail.get';
    const failPath = type === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';

    try {
      const wasModified = await hasBeenModified(app, req, type);

      if (wasModified) {
        return res.redirect(app.namedRoutes.build('summons.update-details.get', { id, type }));
      }

      if (req.session[`summonsUpdate-${id}`].fixedName) {
        await fixNameObj.patch(
          req,
          id,
          'fix-name',
          req.session[`summonsUpdate-${id}`].fixedName,
        );
      }

      await summonsUpdate.patch(
        req,
        id,
        'PERSONAL',
        payload,
      );

      delete req.session[`summonsUpdate-${id}`];
      delete req.session.jurorPaperUpdatePayload;

      app.logger.info('Successfully updated the summons juror details', {
        auth: req.session.authentication,
        jurorNumber: req.params['id'],
      });

      return res.redirect(app.namedRoutes.build(successPath, { id, type }));
    } catch (err) {
      app.logger.crit('Unable to update the summons juror details', {
        auth: req.session.authentication,
        jurorNumber: id,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      generalError(req);

      return res.redirect(app.namedRoutes.build(failPath, { id, type }));
    }
  };

  module.exports.getEditName = (app) => (req, res) => {
    const { id, type } = req.params;
    const { action } = req.query;
    const postUrl = app.namedRoutes.build('summons.update-details.edit-name.post', {
      id,
      type,
    }) + `?action=${action}`;
    const cancelPath = req.params['type'] === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';
    const cancelUrl = app.namedRoutes.build(cancelPath, {
      id,
      type,
    }) + `?action=${action}`;
    const tmpErrors = _.clone(req.session.errors);
    let jurorDetails;

    delete req.session.errors;

    if (action === 'fix') {
      jurorDetails = {
        title: req.session[`summonsUpdate-${id}`].jurorDetails.title,
        firstName: req.session[`summonsUpdate-${id}`].jurorDetails.firstName,
        lastName: req.session[`summonsUpdate-${id}`].jurorDetails.lastName,
      };
    }

    if (action === 'new') {
      jurorDetails = {
        title: req.session[`summonsUpdate-${id}`].jurorDetails.pendingTitle,
        firstName: req.session[`summonsUpdate-${id}`].jurorDetails.pendingFirstName,
        lastName: req.session[`summonsUpdate-${id}`].jurorDetails.pendingLastName,
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

  module.exports.postEditName = (app) => (req, res) => {
    const { id, type } = req.params;
    const validatorResult = validate(req.body, validator.jurorName());
    const { action } = req.query;
    const title = req.body.title.trim();
    const firstName = req.body.firstName.trim();
    const lastName = req.body.lastName.trim();
    const postPath = req.params['type'] === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';

    req.session[`summonsUpdate-${id}`].newJurorDetails = {
      title,
      firstName,
      lastName,
    };

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('summons.update-details.edit-name.get', { 
        id, 
        type
      }) + `?action=${action}`);
    }

    if (action === 'new') {
      req.session[`summonsUpdate-${id}`].pendingJurorName = {
        title,
        firstName,
        lastName,
      };

      delete req.session[`summonsUpdate-${id}`].newJurorDetails;
    }

    if (action === 'fix') {
      req.session[`summonsUpdate-${id}`].fixedName = {
        title,
        firstName,
        lastName,
      };
    }

    return res.redirect(app.namedRoutes.build(postPath, {
      id,
      type
    }));
  };

  module.exports.getEditAddress = (app) => (req, res) => {
    const { id, type } = req.params;
    const cancelPath = type === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';

    const postUrl = app.namedRoutes.build('summons.update-details.edit-address.post', { id, type });
    const cancelUrl = app.namedRoutes.build(cancelPath, { id, type });
    const address = typeof req.session.formFields !== 'undefined'
      ? req.session.formFields : (typeof req.session[`summonsUpdate-${id}`].newAddress !== 'undefined'
        ? req.session[`summonsUpdate-${id}`].newAddress : req.session[`summonsUpdate-${id}`].address);
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.formFields;
    delete req.session.errors;

    return res.render('summons-management/paper-reply/edit-address.njk', {
      postUrl,
      cancelUrl,
      address,
      saveBtnLabel: 'Review Edit',
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postEditAddress = (app) => async (req, res) => {
    const { id, type } = req.params;
    const validatorResult = validate(req.body, validator.jurorAddress());
    const redirectPath = type === 'paper' ?
      'summons.update-details.get' :
      'summons.update-details-digital.get';

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = {
        part1: req.body['address1'],
        part2: req.body['address2'],
        part3: req.body['address3'],
        part4: req.body['address4'],
        part5: req.body['address5'],
        postcode: req.body['postcode'],
      };

      return res.redirect(app.namedRoutes.build('summons.update-details.edit-address.get', { id, type }));
    }

    req.session[`summonsUpdate-${id}`].newAddress = {
      part1: req.body['address1'],
      part2: req.body['address2'],
      part3: req.body['address3'],
      part4: req.body['address4'],
      part5: req.body['address5'],
      postcode: req.body['postcode'],
    };

    return res.redirect(app.namedRoutes.build(redirectPath, { id, type }));
  };

  const resolveJurorName = (response, replyMethod) => {
    const pendingName = {
      pendingTitle: replyMethod === 'paper' ? response.title : response.newTitle,
      pendingFirstName: replyMethod === 'paper' ? response.firstName : response.newFirstName,
      pendingLastName: replyMethod === 'paper' ? response.lastName : response.newLastName,
    };
    const currentName = {
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
