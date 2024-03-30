const _ = require('lodash');
const excusalObj = require('../../../objects/excusal-mod').excusalObject;
const systemCodesDAO = require('../../../objects/administration.js').systemCodesDAO;
const validate = require('validate.js');
const { flowLetterGet, flowLetterPost } = require('../../../lib/flowLetter');

module.exports.index = function (app) {
  return async function (req, res) {
    const backLinkUrl = {
      built: true,
      url: app.namedRoutes.build('juror.update.get', {
        jurorNumber: req.params['jurorNumber'],
      }),
    };
    const processUrl = app.namedRoutes.build('juror.excusal.post', {
      jurorNumber: req.params['jurorNumber'],
    });
    const cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
      jurorNumber: req.params['jurorNumber'],
    });

    try {
      req.session.excusalReasons = await systemCodesDAO.get(app, req, 'EXCUSAL_AND_DEFERRAL');

    } catch (err) {
      app.logger.crit('Failed to fetch excusal codes: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    const tmpErrors = _.clone(req.session.errors);

    return res.render('summons-management/excusal.njk', {
      backLinkUrl,
      processUrl,
      cancelUrl,
      excusalReasons: req.session.excusalReasons,
      errors: {
        message: '',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.post = function (app) {
  return function (req, res) {
    const successCB = function () {

      const codeMessage = req.session.excusalReasons.filter(r => r.code === req.body.excusalCode)[0].description;

      const reason = {
        REFUSE: 'Excusal refused (' + codeMessage.toLowerCase() + ')',
        GRANT: 'Excusal granted (' + codeMessage.toLowerCase() + ')',
      };

      req.session.bannerMessage = reason[req.body.excusalDecision];

      app.logger.info('Juror excusal processed: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          jurorNumber: req.params['jurorNumber'],
          ...req.body,
        },
      });

      if (res.locals.isCourtUser) {
        return res.redirect(app.namedRoutes.build('juror.update.excusal.letter.get', {
          jurorNumber: req.params.jurorNumber,
          letter: req.body.excusalDecision.toLowerCase(),
        }));
      }

      return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: req.params['jurorNumber'],
      }));
    };
    const errorCB = function (err) {
      app.logger.crit('Failed to process the juror excusal: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          jurorNumber: req.params['jurorNumber'],
          ...req.body,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    };

    let excusalValidator = require('../../../config/validation/excusal-mod.js');
    let validatorResult = validate(req.body, excusalValidator());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;
      return res.redirect(app.namedRoutes.build('juror.excusal.get', {
        jurorNumber: req.params['jurorNumber'],
      }));
    }

    return excusalObj.put(
      require('request-promise'),
      app,
      req.session.authToken,
      req.body,
      req.params['jurorNumber'],
      req.session.replyMethod || null,
    )
      .then(successCB)
      .catch(errorCB);
  };
};

module.exports.getExcusalLetter = function (app) {
  return function (req, res) {
    const letterType = req.params.letter === 'grant' ? 'granted' : 'refused';

    return flowLetterGet(req, res, {
      serviceTitle: 'send letter',
      pageIdentifier: 'process - excusal',
      currentApp: 'Summons replies',
      letterMessage: `an excusal ${letterType}`,
      letterType: `excusal-${letterType}`,
      postUrl: app.namedRoutes.build('juror.update.excusal.letter.post', {
        jurorNumber: req.params.jurorNumber,
        letter: req.params.letter,
      }),
      cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: req.params.jurorNumber,
      }),
    });
  };
};

module.exports.postExcusalLetter = function (app) {
  return function (req, res) {
    return flowLetterPost(req, res, {
      errorRoute: app.namedRoutes.build('juror.update.excusal.letter.get', {
        jurorNumber: req.params.jurorNumber,
        letter: req.params.letter,
      }),
      pageIdentifier: 'process - excusal',
      serviceTitle: 'send letter',
      currentApp: 'Summons replies',
      completeRoute: app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: req.params.jurorNumber,
      }),
    });
  };
};
