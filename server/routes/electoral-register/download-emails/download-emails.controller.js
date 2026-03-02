(() => {
  'use strict';

  const { dateFilter } = require('../../../components/filters');
  const { localAuthorityEmailsDAO } = require('../../../objects/electoral-register');

  module.exports.getDownloadLaEmails = (app) => async (req, res) => {
    const { status } = req.params;

    try {
      const laEmailData = (await localAuthorityEmailsDAO.get(req, status)).localAuthorities;

      app.logger.info('Fetched local authority email data', {
        auth: req.session.authentication
      });

      if (!laEmailData.length) {
        app.logger.warn('No local authority email data found', {
          auth: req.session.authentication
        });
      } else {
        const csvResult = [];
        const filename = `${status}-local-authority-emails-${dateFilter(new Date(), null, 'DD-MM-YYYY')}.csv`;


        csvResult.push(['Local authority', 'Email address']);
        laEmailData.forEach(la => {
          la.emailAddresses.forEach(email => {
            csvResult.push([la.laName, email.username]);
          });
        });

        res.set('content-disposition', 'attachment; filename=' + filename);
        res.type('csv');
        res.send(csvResult.join('\n'));
      }
    } catch (err) {
      app.logger.crit('Error generating local authority email csv', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }
  };

})();
