(function() {
  'use strict';

  const _ = require('lodash');
  const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
  const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
  const validate = require('validate.js');
  const validator = require('../../../config/validation/paper-reply').cjsEmployment;
  const { hasBeenModified, generalError } = require('./summons-update-common');

  module.exports.get = function(app) {
    return async function(req, res) {
      const { id } = req.params;
      const postUrl = app.namedRoutes.build('summons.update-employment.post', {
        id: req.params['id'],
        type: req.params['type'],
      });
      const cancelUrl = app.namedRoutes.build('response.paper.details.get', {
        id: req.params['id'],
        type: 'paper',
      });
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      try {
        const { headers, data } = await paperReplyObj.get(
          req,
          req.params['id']
        );

        req.session[`summonsUpdate-${id}`] = {
          etag: headers['etag'],
        };

        const employments = resolveEmployments(data.cjsEmployment);

        return res.render('summons-management/paper-reply/cjs-employment.njk', {
          postUrl,
          cancelUrl,
          ...employments,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
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

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.post = function(app) {
    return async function(req, res) {
      const { id } = req.params;
      const payload = req.body.cjsEmploymentResponse === 'yes'
        ? prepareEmployments(req.body) : null;

      const validatorResult = validate(req.body, validator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('summons.update-employment.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }

      try {
        const wasModified = await hasBeenModified(app, req);

        if (wasModified) {
          return res.redirect(app.namedRoutes.build('summons.update-employment.get', {
            id: req.params['id'],
            type: 'paper',
          }));
        }

        await summonsUpdate.patch(
          req,
          req.params['id'],
          'CJS',
          { cjsEmployment: payload }
        );

        delete req.session[`summonsUpdate-${id}`];

        app.logger.info('Updated the summons cjs employments', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
        });

        return res.redirect(app.namedRoutes.build('response.paper.details.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      } catch (err) {
        app.logger.crit('Unable to save the summons cjs employment', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        generalError(req);

        return res.redirect(app.namedRoutes.build('summons.update-employment.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }
    };
  };

  function prepareEmployments(body) {
    return Object.keys(body).reduce((prev, emp) => {
      if (emp === '_csrf') return prev;
      if (body[emp] === '') return prev;

      switch (emp) {
      case 'cjsSystemOptionsPolice':
        prev.push({
          cjsEmployer: 'Police Force',
          cjsEmployerDetails: body.cjsSystemPoliceDetails,
        });
        break;
      case 'cjsSystemOptionsPrison':
        prev.push({
          cjsEmployer: 'HM Prison Service',
          cjsEmployerDetails: body.cjsSystemHmPrisonDetails,
        });
        break;
      case 'cjsSystemOptionsCrime':
        prev.push({
          cjsEmployer: 'National Crime Agency',
          cjsEmployerDetails: body.cjsSystemNationalCrimeDetails,
        });
        break;
      case 'cjsSystemOptionsJudiciary':
        prev.push({
          cjsEmployer: 'Judiciary',
          cjsEmployerDetails: body.cjsSystemJudiciaryDetails,
        });
        break;
      case 'cjsSystemOptionsCourts':
        prev.push({
          cjsEmployer: 'HMCTS',
          cjsEmployerDetails: body.cjsSystemCourtsDetails,
        });
        break;
      case 'cjsSystemOptionsOther':
        prev.push({
          cjsEmployer: 'Other',
          cjsEmployerDetails: body.cjsSystemOtherDetails,
        });
        break;
      }

      return prev;
    }, []);
  }

  function resolveEmployments(employments) {
    if (!employments) return {
      cjsEmploymentChecked: {
        value: 'no',
      },
    };

    const result = {
      cjsEmploymentValues: {},
      cjsEmploymentChecked: {
        value: 'yes',
      },
    };

    employments.reduce((prev, empl) => {
      switch (empl.cjsEmployer) {
      case 'Police Force':
        result['cjsSystemOptionsPoliceChecked'] = true;
        result['cjsEmploymentValues']['police force'] = empl.cjsEmployerDetails;
        break;
      case 'HM Prison Service':
        result['cjsSystemOptionsPrisonChecked'] = true;
        result['cjsEmploymentValues']['hm prison service'] = empl.cjsEmployerDetails;
        break;
      case 'National Crime Agency':
        result['cjsSystemOptionsCrimeChecked'] = true;
        result['cjsEmploymentValues']['national crime agency'] = empl.cjsEmployerDetails;
        break;
      case 'Judiciary':
        result['cjsSystemOptionsJudiciaryChecked'] = true;
        result['cjsEmploymentValues']['judiciary'] = empl.cjsEmployerDetails;
        break;
      case 'HMCTS':
        result['cjsSystemOptionsCourtsChecked'] = true;
        result['cjsEmploymentValues']['hmcts'] = empl.cjsEmployerDetails;
        break;
      case 'Other':
        result['cjsSystemOptionsOtherChecked'] = true;
        result['cjsEmploymentValues']['other'] = empl.cjsEmployerDetails;
        break;
      }

      return prev;
    }, result);

    return result;
  }

})();
