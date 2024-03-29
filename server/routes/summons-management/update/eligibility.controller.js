const _ = require('lodash');
const paperReplyObj = require('../../../objects/paper-reply').paperReplyObject;
const summonsUpdate = require('../../../objects/summons-management').summonsUpdate;
const { hasBeenModified, generalError } = require('./summons-update-common');

module.exports.get = function (app) {
  return async function (req, res) {
    const postUrl = app.namedRoutes.build('summons.update-eligibility.post', {
      id: req.params['id'],
      type: req.params['type'],
    });
    const cancelUrl = app.namedRoutes.build('response.paper.details.get', {
      id: req.params['id'],
      type: 'paper',
    }) + '#eligibility';
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    try {
      const { headers, data } = await paperReplyObj.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['id'],
      );

      req.session.summonsUpdate = {
        etag: headers['etag'],
      };

      const eligibility = Object.keys(data.eligibility)
        .reduce((prev, entry) => {
          const entryValue = data.eligibility[entry];

          switch (entryValue) {
            case true:
              prev[entry] = 'yes';
              break;
            case false:
              prev[entry] = 'no';
              break;
            default:
              prev[entry] = null;
          }

          return prev;
        }, {});

      return res.render('summons-management/paper-reply/eligibility.njk', {
        postUrl,
        cancelUrl,
        ...eligibility,
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

      return res.render('_errors/generic.njk');
    }
  };
};

module.exports.post = function (app) {
  return async function (req, res) {
    const eligibility = {
      convicted: null,
      livedConsecutive: null,
      mentalHealthAct: null,
      mentalHealthCapacity: null,
      onBail: null,
    };
    const payload = {
      eligibility: Object.keys(req.body).reduce((prev, eligibilityItem) => {
        if (eligibilityItem === '_csrf') return prev;
        prev[eligibilityItem] = req.body[eligibilityItem] === 'yes';
        return prev;
      }, eligibility),
    };

    try {
      const wasModified = await hasBeenModified(app, req);

      if (wasModified) {
        return res.redirect(app.namedRoutes.build('summons.update-eligibility.get', {
          id: req.params['id'],
          type: 'paper',
        }));
      }

      await summonsUpdate.patch(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['id'],
        'ELIGIBILITY',
        payload,
      );

      app.logger.info('Successfully updated the juror eligibility: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          ...payload,
          summonsId: req.params['id'],
        },
      });

      return res.redirect(app.namedRoutes.build('response.paper.details.get', {
        id: req.params['id'],
        type: 'paper',
      }));
    } catch (err) {
      app.logger.crit('Could not update the summons eligibility details', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      generalError(req);

      return res.redirect(app.namedRoutes.build('summons.update-eligibility.get', {
        id: req.params['id'],
        type: 'paper',
      }));
    }
  };
};
