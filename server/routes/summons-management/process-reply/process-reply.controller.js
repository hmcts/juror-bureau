/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const summonsValidator = require('../../../config/validation/summons-management');
const validate = require('validate.js');

module.exports.getProcessReply = function(app) {
  return function(req, res) {
    var tmpErrors = _.clone(req.session.errors)
      , routeParameters = {
        id: req.params['id'],
        type: req.params['type'],
      }
      , processUrl
      , cancelUrl;

    delete req.session.errors;
    delete req.session.formFields;

    processUrl = app.namedRoutes.build('process-reply.post', routeParameters);
    if (req.params['type'] === 'paper') {
      cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
    } else {
      cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
    }

    return res.render('summons-management/process-reply', {
      jurorNumber: req.params['id'],
      processUrl: processUrl,
      cancelUrl: cancelUrl,
      isLateSummons: req.session.replyDetails.isLateSummons,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postProcessReply = function(app) {
  return function(req, res) {
    var validatorResult
      , processActionType = {
        responded: 'response.detail.responded.get',
        deferral: 'process-deferral-dates.get',
        excusal: 'process-excusal.get',
        disqualify: 'process-disqualify.get',
      }
      , routeParameters = {
        id: req.params['id'],
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

    validatorResult = validate(req.body, summonsValidator.processAction());
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('process-reply.get', routeParameters));
    }

    if (typeof processActionType[req.body.processActionType] === 'undefined') {
      req.session.errors = {
        processActionType: [{
          summary: 'This option is not implemented yet',
          details: 'This option is not implemented yet',
        }],
      };

      return res.redirect(app.namedRoutes.build('process-reply.get', routeParameters));
    }

    return res.redirect(app.namedRoutes.build(processActionType[req.body.processActionType], routeParameters));
  };
};
