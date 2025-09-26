(function() {
  'use strict';

  const _ = require('lodash');
  const { changeName } = require('../../../objects/juror-record');
  const { nameChangeValidator } = require('../../../config/validation/juror-record');

  module.exports.getNewName = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('juror-management/new-name/index.njk', {
        jurorNumber,
        decision: req.session.changeName,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postNewName = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const { decision, approveMessage, rejectMessage } = req.body;

      if (decision) {
        req.session.changeName = {
          decision,
          notes: (decision === 'APPROVE') ? approveMessage : rejectMessage,
        };
      }

      const validatorResult = nameChangeValidator(req.body);

      if (validatorResult) {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('juror-record.details.new-name.get', {
          jurorNumber,
        }));
      }

      if (decision === 'APPROVE') {
        return postApproveName(app, req, res);
      }

      if (decision === 'REJECT') {
        return res.redirect(app.namedRoutes.build('juror-record.details.new-name.reject.get', {
          jurorNumber,
        }));
      }
    };
  };

  function postApproveName(app, req, res) {
    const { jurorNumber } = req.params;
    const payload = _.clone(req.session.changeName);

    return changeName.patch(
      req,
      jurorNumber,
      'change-name',
      payload,
    ).then(() => {
      delete req.session.changeName;

      app.logger.info('The juror name change request has been approved', {
        auth: req.session.authentication,
        data: {
          jurorNumber
        },
      });

      return res.redirect(app.namedRoutes.build('juror-record.police-check.get', {
        jurorNumber,
      }));
    });
  };

  module.exports.getRejectName = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const postUrl = app.namedRoutes.build('juror-record.details.new-name.reject.post', {
        jurorNumber,
      });
      const cancelUrl = app.namedRoutes.build('juror-record.details.get', {
        jurorNumber,
      });
      const backLinkUrl = {
        url: app.namedRoutes.build('juror-record.details.new-name.get', {
          jurorNumber,
        }),
        built: true,
      };

      return res.render('juror-management/new-name/reject.njk', {
        jurorNumber,
        postUrl,
        cancelUrl,
        backLinkUrl,
      });
    };
  };

  module.exports.postRejectName = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const payload = _.clone(req.session.changeName);

      delete req.session.changeName;

      return changeName.patch(
        req,
        jurorNumber,
        'change-name',
        payload,
      ).then(() => {
        delete req.session.changeName;

        app.logger.info('The juror name change request has been rejected', {
          auth: req.session.authentication,
          data: { 
            jurorNumber
          },
        });

        return res.redirect(app.namedRoutes.build('juror-record.details.get', {
          jurorNumber,
        }));
      });
    };
  };

})();
