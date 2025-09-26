(function() {
  'use strict';

  const _ = require('lodash');
  const { judgesDAO, judgeDetailsDAO } = require('../../../objects/administration');
  const { replaceAllObjKeys } = require('../../../lib/mod-utils');
  const { makeManualError } = require('../../../lib/mod-utils');
  const { validate } = require('validate.js');
  const editJudgeValidator = require('../../../config/validation/edit-judge');

  module.exports.getJudges = function(app) {
    return async function(req, res) {
      const judgeType = req.query.judgeType || 'active';
      let activeJudges = [];
      let inactiveJudges = [];

      let bannerMessage;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }
      delete req.session.bannerMessage;

      try {
        activeJudges = await judgesDAO.get(req, true);

        if (judgeType === 'all') {
          inactiveJudges = await judgesDAO.get(req, false);
        }

        const judges = activeJudges.concat(inactiveJudges);

        app.logger.info('Fetched list of judges: ', {
          auth: req.session.authentication
        });

        replaceAllObjKeys(judges, _.camelCase);

        return res.render('administration/judges/judges.njk', {
          bannerMessage,
          judgeType,
          judges,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch judges: ', {
          auth: req.session.authentication,
          data: {
            isActive: req.query.judgeType || 'active',
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.getEditJudge = function(app) {
    return async function(req, res) {
      const { judgeId } = req.params;
      const tmpBody = _.clone(req.session.formFields);
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;

      try {
        const judge = await judgeDetailsDAO.get(req, judgeId);

        app.logger.info('Fetched judges details: ', {
          auth: req.session.authentication
        });

        replaceAllObjKeys(judge, _.camelCase);

        return res.render('administration/judges/edit-judge.njk', {
          judge,
          processUrl: app.namedRoutes.build('administration.judges.edit.post', {
            judgeId,
          }),
          cancelUrl: app.namedRoutes.build('administration.judges.get'),
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch judge\'s details: ', {
          auth: req.session.authentication,
          data: {
            judgeId,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postEditJudge = function(app) {
    return async function(req, res) {
      const { judgeId } = req.params;

      const formData = _.clone(req.body);
      const validatorResult = validate(req.body, editJudgeValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.formFields = req.body;
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('administration.judges.edit.get', { judgeId }));
      }

      try {
        const payload = replaceAllObjKeys(req.body, _.snakeCase);

        delete payload._csrf;

        await judgesDAO.put(req, judgeId, payload);

        app.logger.info('Updated judges details: ', {
          auth: req.session.authentication,
          data: {
            judgeId,
            payload,
          },
        });

        req.session.bannerMessage = 'Judge details updated';

        return res.redirect(app.namedRoutes.build('administration.judges.get'));
      } catch (err) {
        app.logger.crit('Failed to update judge\'s details: ', {
          auth: req.session.authentication,
          data: {
            judgeId,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error?.code === 'CODE_ALREADY_IN_USE') {
          req.session.errors = makeManualError('judgeCode', 'A judge with this code already exists');
            req.session.formFields = formData;
            return res.redirect(app.namedRoutes.build('administration.judges.edit.get', { judgeId }));
        }

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.getDeleteJudge = function(app) {
    return async function(req, res) {
      const { judgeId } = req.params;

      const tmpErrors = _.clone(req.session.errors);
      delete req.session.errors;

      try {
        const judge = await judgeDetailsDAO.get(req, judgeId);

        app.logger.info('Fetched judges details: ', {
          auth: req.session.authentication,
          data: {
            judge,
          },
        });

        replaceAllObjKeys(judge, _.camelCase);

        return res.render('administration/judges/delete-judge.njk', {
          judge,
          processUrl: app.namedRoutes.build('administration.judges.delete.post', {
            judgeId,
          }),
          cancelUrl: app.namedRoutes.build('administration.judges.get'),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch judge\'s details: ', {
          auth: req.session.authentication,
          data: {
            judgeId,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postDeleteJudge = function(app) {
    return async function(req, res) {
      const { judgeId } = req.params;

      try {

        await judgesDAO.delete(req, judgeId);

        app.logger.info('Deleted the unused judge: ', {
          auth: req.session.authentication,
          data: {
            judgeId,
          },
        });

        req.session.bannerMessage = 'Judge deleted';

        return res.redirect(app.namedRoutes.build('administration.judges.get'));
      } catch (err) {
        app.logger.crit('Failed to delete judge: ', {
          auth: req.session.authentication,
          data: {
            judgeId,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error?.code === 'CANNOT_DELETE_USED_JUDGE') {
          req.session.errors = makeManualError('judge', 'Judge has been used and cannot be deleted');
            return res.redirect(app.namedRoutes.build('administration.judges.delete.get', { judgeId }));
        }

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.getAddJudge = function(app) {
    return async function(req, res) {
      const { judgeId } = req.params;
      const tmpBody = _.clone(req.session.formFields);
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;

      return res.render('administration/judges/add-judge.njk', {
        processUrl: app.namedRoutes.build('administration.judges.add.post', {
          judgeId,
        }),
        cancelUrl: app.namedRoutes.build('administration.judges.get'),
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });

    };
  };

  module.exports.postAddJudge = function(app) {
    return async function(req, res) {

      const formData = _.clone(req.body);
      const validatorResult = validate(req.body, editJudgeValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.formFields = req.body;
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('administration.judges.add.get'));
      }

      const payload = replaceAllObjKeys(req.body, _.snakeCase);

      delete payload._csrf;

      try {
        await judgesDAO.post(req, payload);

        app.logger.info('Added new judge: ', {
          auth: req.session.authentication,
          data: {
            payload,
          },
        });

        req.session.bannerMessage = 'Judge added';

        return res.redirect(app.namedRoutes.build('administration.judges.get'));
      } catch (err) {
        app.logger.crit('Failed to add new judge: ', {
          auth: req.session.authentication,
          data: {
            payload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error?.code === 'CODE_ALREADY_IN_USE') {
          req.session.errors = makeManualError('judgeCode', 'A judge with this code already exists');
          req.session.formFields = formData;
          return res.redirect(app.namedRoutes.build('administration.judges.add.get' ));
        }

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
