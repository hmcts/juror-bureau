/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const summonsValidator = require('../../../config/validation/summons-management');
const digitalResponseObj = require('../../../objects/response-detail').object;
const paperResponseObj = require('../../../objects/paper-reply').paperReplyObject;
const validate = require('validate.js');

module.exports.checkOwner = (app) => async (req, res, next) =>{
  const { id, type } = req.params;
  const responseObj = type === 'paper' ? paperResponseObj : digitalResponseObj;

  try {
    const response = await responseObj.get(
      req,
      id,
    );

    const currentOwner = type === 'paper' 
      ? response.data.current_owner : response.current_owner;

    if (currentOwner !== req.session.authentication.locCode) {
      app.logger.crit('Current user does not have sufficient permission to process this summons reply: ', {
        auth: req.session.authentication,
      });
      return res.status(403).render('_errors/403.njk');
    }

    next();
  } catch (err) {
    if (typeof err.error !== 'undefined' && err.error.status === 403) {
      app.logger.crit('Current user does not have sufficient permission to process this summons reply: ', {
        auth: req.session.authentication,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.status(403).render('_errors/403.njk');
    }
    app.logger.crit('Failed to fetch juror details', {
      auth: req.session.authentication,
      error: typeof err.error !== 'undefined' ? err.error : err.toString(),
    });

    return res.render('_errors/generic', { err });
  }
};

module.exports.getProcessReply = (app) => (req, res) =>{
  const tmpErrors = _.clone(req.session.errors);
  const routeParameters = {
    id: req.params['id'],
    type: req.params['type'],
  }
  let cancelUrl;

  delete req.session.errors;
  delete req.session.formFields;
  delete req.session.processLateSummons;

  if (req.params['type'] === 'paper') {
    cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
  } else {
    cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
  }

  return res.render('summons-management/process-reply', {
    jurorNumber: req.params['id'],
    processUrl: app.namedRoutes.build('process-reply.post', routeParameters),
    cancelUrl,
    isLateSummons: req.session.replyDetails.isLateSummons,
    errors: {
      title: 'Please check the form',
      count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
      items: tmpErrors,
    },
  });
};

module.exports.postProcessReply = (app) => (req, res) => {
  const processActionType = {
    responded: 'response.detail.responded.get',
    deferral: 'process-deferral-dates.get',
    excusal: 'process-excusal.get',
    disqualify: 'process-disqualify.get',
    reassign: 'juror-management.reassign.get',
    postpone: 'juror.update.postpone-date.get',
  };
  const routeParameters = {
    id: req.params['id'],
    jurorNumber: req.params['id'],
  };

  if (req.params['type'] === 'paper') {
    routeParameters.type = 'paper';
  } else {
    routeParameters.type = 'digital';
  }

  delete req.session.errors;
  delete req.session.formFields;
  delete req.session.deferralDates;
  delete req.session.deferralSelectedReason;

  const validatorResult = validate(req.body, summonsValidator.processAction());
  if (typeof validatorResult !== 'undefined') {
    req.session.errors = validatorResult;
    req.session.formFields = req.body;

    return res.redirect(app.namedRoutes.build('process-reply.get', routeParameters));
  }

  if (req.session[`catchmentWarning-${req.params.id}`] && req.session[`catchmentWarning-${req.params.id}`].isOutwithCatchment) {
    routeParameters.action = req.body.processActionType;

    if (req.body.processActionType === 'disqualify') {
      return res.redirect(app.namedRoutes.build(processActionType[req.body.processActionType], routeParameters));
    }

    return res.redirect(app.namedRoutes.build('reassign-before-process.get', routeParameters));
  }

  if (req.body.processActionType === 'reassign' || req.body.processActionType === 'postpone') {
    req.session.processLateSummons = {
      backUrl: app.namedRoutes.build('process-reply.get', routeParameters),
      cancelUrl: app.namedRoutes.build(req.params['type'] === 'paper' ?
        'response.paper.details.get' : 'response.detail.get', routeParameters),
    };
  }

  return res.redirect(app.namedRoutes.build(processActionType[req.body.processActionType], routeParameters));
};
