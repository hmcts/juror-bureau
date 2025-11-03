(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const summonsValidator = require('../../../config/validation/summons-management');
  const requestInfoObj = require('../../../objects/summons-management').requestInfoObject;
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.getRequestInfo = (app) => (req, res) => {
    const { id, type } = req.params;
    const tmpErrors = _.clone(req.session.errors);
    let cancelUrl;

    if (req.session.replyDetails.jurorNumber !== id) {
      return res.redirect(app.namedRoutes('response.detail.get', { id }));
    }

    if (type === 'paper') {
      cancelUrl = app.namedRoutes.build('response.paper.details.get', { id, type });
    } else {
      cancelUrl = app.namedRoutes.build('response.detail.get', { id, type });
    }

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('summons-management/request-info/form', {
      response: req.session.replyDetails,
      requestInfo: req.session.requestInfo,
      cancelUrl: cancelUrl,
      errors: {
        title: 'There is a problem',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      }
    });
  }

  module.exports.postRequestInfo = (app) => (req, res) => {
    const { id, type } = req.params;
    let letterInfoDto = [];

    const validatorResult = validate(req.body, summonsValidator.requestInfo());
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('request-info.by-post.get', { id, type }));
    }

    req.session.requestInfo = _.clone(req.body);
    delete req.session.requestInfo._csrf;

    Object.values(req.session.requestInfo).forEach((infoItem) => {
      if (Array.isArray(infoItem)) {
        infoItem.forEach(singleInfoItem => letterInfoDto.push(singleInfoItem))
      } else {
        letterInfoDto.push(infoItem.toString());
      }
    })

    req.session.letterInfoDto = letterInfoDto;

    return res.redirect(app.namedRoutes.build('request-info.by-post.letter.get', { id, type }));
  }

  module.exports.getRequestInfoLetter = (app) => (req, res) => {
    const { id, type } = req.params;
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    return res.render('summons-management/request-info/send-letter', {
      response: req.session.replyDetails,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
      submitUrl:  app.namedRoutes.build('request-info.by-post.letter.post', { id, type }),
      backLinkUrl: {
        url: app.namedRoutes.build('request-info.by-post.get', { id, type }),
        built: true,
      },
      manual: Object.keys(req.session.requestInfo).includes('info-signature'),
    });
  }

  module.exports.postRequestInfoLetter = (app) =>  async (req, res) => {
    const { id, type } = req.params;
    if (req.body.manual === 'true') {
      app.logger.info('Letter to be manually sent to the juror: ', {
        auth: req.session.authentication,
        data: req.session.letterInfoDto,
      });

      delete req.session.requestInfo;
      delete req.session.letterInfoDto;

      if (type === 'paper') {
        return res.redirect(app.namedRoutes.build('response.paper.details.get', { id, type }));
      }
      return res.redirect(app.namedRoutes.build('response.detail.get', { id }));
    }

    try {
      await requestInfoObj.post(
        req,
        id.toString(),
        req.session.letterInfoDto,
        type.toUpperCase()
      );

      app.logger.info('Successfully requested information from juror: ', {
        auth: req.session.authentication,
        data: req.session.letterInfoDto,
      });

      delete req.session.requestInfo;
      delete req.session.letterInfoDto;
      delete req.session.missingAwaitInfo;

      if (req.params['type'] === 'paper') {
        return res.redirect(app.namedRoutes.build('response.paper.details.get', { id, type }));
      }
      return res.redirect(app.namedRoutes.build('response.detail.get', { id }));
    } catch (err) {
      app.logger.crit('Failed to request information from juror: ', {
        auth: req.session.authentication,
        data: req.session.letterInfoDto,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      req.session.errors = makeManualError('sendLetter', 'Request could not be processed');

      return res.redirect(app.namedRoutes.build('request-info.by-post.letter.get', { id, type }));
    }
  }

})();
