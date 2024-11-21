(function() {
  'use strict';

  const _ = require('lodash');
  const { makeManualError, buildMovementProblems } = require('../../../../lib/mod-utils');
  const { changeDate, jurorRecordDetailsDAO } = require('../../../../objects');

  module.exports.getValidateOnCallJurors = (app) => {
    return async (req, res) => {
      const selectedJurorNumbers = _.clone(req.session.poolJurorsOnCall).selectedJurors;
      const continueUrl = app.namedRoutes.build('pool-management.on-call.validate.post', {
        poolNumber: req.params.poolNumber,
      });
      const cancelUrl = app.namedRoutes.build('pool-overview.get', {
        poolNumber: req.params.poolNumber
      });

      let poolMembers;
      try {
        poolMembers = await jurorRecordDetailsDAO.post(req, selectedJurorNumbers.map(jurorNumber => {
          return {
            'juror_number': jurorNumber,
            'juror_version': null,
            'include': ['NAME_DETAILS', 'ACTIVE_POOL'],
          }
        }));

        delete poolMembers['_headers'];

        poolMembers = Object.values(poolMembers);
      } catch (err) {
        app.logger.crit('Failed to fetch pool members to validate bulk placing on call: ', {
          auth: req.session.authentication,
          poolNumber: req.params.poolNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };

      const unavailableJurors = poolMembers.filter(juror => !['Responded', 'Panel', 'Juror'].includes(juror.active_pool.status)).map((juror) => {
        return {
          jurorNumber: juror.juror_number,
          firstName: juror.name.firstName,
          lastname: juror.name.lastName,
          failureReason: `Invalid Status: ${juror.active_pool.status}`,
        };
      });

      if (!unavailableJurors.length) {
        return res.redirect(app.namedRoutes.build('pool-management.on-call.confirm.get', {
          poolNumber: req.params.poolNumber,
        }));
      }

      return res.render('pool-management/movement/bulk-validate', {
        cancelUrl: cancelUrl,
        continueUrl: continueUrl,
        problems: buildMovementProblems({
          unavailableForMove: unavailableJurors
        }),
      });
    }
  };

  module.exports.postValidateOnCallJurors = (app) => {
    return async (req, res) => {
      const selectedJurorNumbers = _.clone(req.session.poolJurorsOnCall).selectedJurors;

      let poolMembers;
      try {
        poolMembers = await jurorRecordDetailsDAO.post(req, selectedJurorNumbers.map(jurorNumber => {
          return {
            'juror_number': jurorNumber,
            'juror_version': null,
            'include': ['NAME_DETAILS', 'ACTIVE_POOL'],
          }
        }));

        delete poolMembers['_headers'];

        poolMembers = Object.values(poolMembers)
      } catch (err) {
        app.logger.crit('Failed to fetch pool members to validate bulk placing on call: ', {
          auth: req.session.authentication,
          poolNumber: req.params.poolNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };

      req.session.poolJurorsOnCall.selectedJurors = poolMembers.filter(juror => ['Responded', 'Panel', 'Juror'].includes(juror.active_pool.status)).map(juror => juror.juror_number);

      return res.redirect(app.namedRoutes.build('pool-management.on-call.confirm.get', {
        poolNumber: req.params.poolNumber,
      }));
    }
  };

  module.exports.getConfirmOnCallJurors = (app) => {
    return (req, res) => {
      const selectedJurors = _.clone(req.session.poolJurorsOnCall).selectedJurors;

      return res.render('pool-management/on-call/on-call-confirmation', {
        jurors: selectedJurors,
        cancelUrl: app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params.poolNumber,
        })
      });
    }
  };

  module.exports.postConfirmOnCallJurors = (app) => {
    return async (req, res) => {
      const jurors = _.clone(req.session.poolJurorsOnCall).selectedJurors;
      const payload = {
        'juror_numbers': jurors,
        'on_call': true,
      };

      try {
       await changeDate.patch(
          req,
          payload,
        ); 
      } catch (err) {
        app.logger.crit('Failed to place jurors on call: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        let errorMessage = `Failed to place ${jurors.length} juror${jurors.length > 1 ? 's' : ''} on call`
        if (err.statusCode === 400 && err.error.message === 'Juror status is already on call') {
          errorMessage += ` - ${jurors.length > 1 ? 'One or more s' : 'S'}elected juror${jurors.length > 1 ? 's are' : ' is'} already on call`
        }
        req.session.errors = makeManualError('onCall', errorMessage);

        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params.poolNumber
        }));
      }

      req.session.bannerMessage = `${jurors.length} juror${jurors.length > 1 ? 's are' : ' is'} now on call`;

      return res.redirect(app.namedRoutes.build('pool-overview.get', {
        poolNumber: req.params.poolNumber
      }));
    }
  };

})();