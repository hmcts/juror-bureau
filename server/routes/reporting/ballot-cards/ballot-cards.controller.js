const { getBallotPDF } = require('../../../lib/reports/ballot');
const { standardReportDAO } = require('../../../objects');

module.exports.printPoolBallotCards = (app) => {
  return async (req, res) => {
    const { ballotType, filter } = req.params;

    app.logger.info('Printing ballot cards for trial: ', {
      auth: req.session.authentication,
      data: {
        ballotType,
        filter,
      },
    });

    let tableData;
    const config = {
      locCode: req.session.authentication.locCode,
    };

    if (ballotType === 'trial') {
      config.trialNumber = filter;
      config.reportType = 'BallotPanelTrialReport';
    }

    if (ballotType === 'pool') {
      config.poolNumber = filter;
      config.reportType = 'BallotPanelPoolReport';
    }

    try {
      ({ tableData } = await standardReportDAO.post(req, app, config));
    } catch (err) {

      app.logger.crit('Error getting ballot panel data', {
        auth: req.session.authentication,
        data: {
          ballotType,
          filter,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    const jurors = tableData.data.map(({ jurorNumber, firstName, lastName, jurorPostcode }) => ({
      id: jurorNumber,
      firstName: firstName,
      lastName: lastName,
      postcode: jurorPostcode,
    }));

    return getBallotPDF(app, req, res, jurors);
  };
};
