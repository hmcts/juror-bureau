;(function(){
  'use strict';

  const responsesObj = require('../../objects/responses').object;
  const utils = require('../../lib/utils');
  const { isCourtUser } = require('../../components/auth/user-type');

  module.exports.index = (app) => async (req, res) => {
    let courtLocCode;
    if (isCourtUser(req)){
      courtLocCode = req.session.authentication.locCode;
    }

    try {
      const responses = await responsesObj.query(req, 'pending', courtLocCode);

      app.logger.info('Fetched and parsed list of pending responses: ', {
        auth: req.session.authentication,
      });

      responses.items = utils.sortResponseData(responses.items, 'rawReceivedAt', false);

      // set alert details
      responses.items.forEach(function(item) {
        item.alert = utils.getResponseAlert(item);
      });

      req.session.sourceUrl = req.path;

      res.locals.todoCount = responses.counts.todo;
      res.locals.workCount = responses.counts.todo + responses.counts.pending;

      return res.render('pending.njk', {
        responses,
      });
    } catch (err) {
      app.logger.crit('Failed to fetch and parse list of pending responses: ', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('index.njk');
    }
  };
    
})();
