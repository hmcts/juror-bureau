(() => {
  'use strict';

  const { dateFilter } = require('../../../components/filters');
  const { localAuthorityEmailsDAO, erLocalAuthorityStatusDAO } = require('../../../objects/electoral-register');

  module.exports.getDownloadLaEmails = (app) => async (req, res) => {
    const { status } = req.params;

    try {
      const laEmailData = (await localAuthorityEmailsDAO.get(req, status)).localAuthorities;
      const payload = {
        uploadStatus: ['UPLOADED', 'NOT_UPLOADED'],
      };
      const localAuthorityStatus = await erLocalAuthorityStatusDAO.post(req, payload);

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


        //TODO: Update api to return active status;
        csvResult.push(['Local authority', 'LA active?', 'Email address', 'Upload status', 'Last upload date', 'Initial email status']);
        laEmailData.forEach(la => {
          la.emailAddresses.forEach(email => {
            const laStatus = localAuthorityStatus.localAuthorityStatuses.find(laStatus => laStatus.localAuthorityCode === la.laCode) || {};
            csvResult.push([
              `"${la.laName}"`,
              `"${la.isActive}"`,
              `"${email.username}"`,
              `"${laStatus.uploadStatus || '-'}"`,
              `"${laStatus.lastUploadDate || '-'}"`,
              `"${laStatus.initialEmailStatus || '-'}"`
            ]);
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
