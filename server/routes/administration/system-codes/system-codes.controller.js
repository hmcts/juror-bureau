(function() {
  'use strict';

  const { systemCodesDAO } = require('../../../objects/administration');
  const systemCodes = {
    'disqualified': {
      key: 'DISQUALIFIED',
      title: 'Disqualified codes',
    },
    'juror-status': {
      key: 'JUROR_STATUS',
      title: 'Juror status codes',
    },
    'trial-types': {
      key: 'TRIAL_TYPE',
      title: 'Trial types',
    },
    'id-check': {
      key: 'ID_CHECK',
      title: 'ID check codes',
    },
    'excusal-deferral': {
      key: 'EXCUSAL_AND_DEFERRAL',
      title: 'Excusal and deferral codes',
    },
    'phone-log': {
      key: 'PHONE_LOG',
      title: 'Phone log codes',
    },
    'reasonable-adjustments': {
      key: 'REASONABLE_ADJUSTMENTS',
      title: 'Reasonable adjustment codes',
    },
  };

  module.exports.getSystemCodesList = function(app) {
    return async function(req, res) {
      return res.render('administration/system-codes-list.njk');
    };
  };

  module.exports.getViewCodes = function(app) {
    return async function(req, res) {
      const { codeType } = req.params;

      try {
        const codes = await systemCodesDAO.get(req, systemCodes[codeType].key);

        console.log('\n\n',codes,'\n\n');

        return res.render('administration/system-codes.njk', {
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('administration.system-codes.get'),
          },
          title: systemCodes[codeType].title,
          codes,
          showActiveColumn:  codes.some((code) => code.is_active !== null),
        });

      } catch (err) {
        app.logger.crit('Failed to fetch system codes', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            codeType: systemCodes[codeType],
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
