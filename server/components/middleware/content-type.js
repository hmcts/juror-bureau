const { Logger } = require('../logger');

module.exports.validateContentType = function(req, res, next) {
  try {

    if (req.method === 'POST' && req.is('application/json')) {
      Logger.instance.crit('Unsupported content type in request: ', {
        contentType: req.headers['content-type']?.toLowerCase() || '',
        method: req.method,
        url: req.originalUrl,
      });
      return res.render('_errors/415.njk');
    }

    next();

  } catch (error) {
    Logger.instance.crit('Error in validateContentType middleware: ', error);
  }
}