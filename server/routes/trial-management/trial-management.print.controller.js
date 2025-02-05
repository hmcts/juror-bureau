const { mapCamelToSnake, camelToSnake } = require('../../lib/mod-utils');
const { capitalise, dateFilter, makeDate } = require('../../components/filters');
const { trialsListDAO } = require('../../objects');
const { generateDocument } = require('../../lib/reports/single-generator');

module.exports.getPrintTrials = (app) => {
  return async (req, res) => {
    const { isActive, sortBy, sortOrder } = req.query;

    const opts = {
      active: isActive || 'true',
      pageNumber: 1,
      pageLimit: 500,
      sortField: capitalise(camelToSnake(sortBy || 'startDate')),
      sortMethod: sortOrder === 'descending' ? 'DESC' : 'ASC',
    };

    let response;

    try {
      response = await trialsListDAO.post(req, mapCamelToSnake(opts));
    } catch (err) {
      app.logger.crit('Failed to get trials list', {
        auth: req.session.authentication,
        data: opts,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    const documentContent = buildPdfTable(response.data, response.totalItems, isActive === 'false');

    let document;
    try {
      document = await generateDocument(documentContent);
    } catch (err) {
      app.logger.crit('Failed to generate PDF document', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    res.contentType('application/pdf');
    res.send(document);
  };
}

function buildPdfTable(data, amount, includeInactive) {
  const body = data.map((trial) => {
    return [
      { text: trial.trialNumber },
      { text: trial.parties },
      { text: trial.trialType },
      { text: trial.court },
      { text: trial.courtroom },
      { text: trial.judge },
      { text: dateFilter(makeDate(trial.startDate), 'YYYY,MM,DD', 'ddd DD MMM YYYY') },
    ];
  });

  return {
    metadata: {
      left: [
        { key: 'Trials', value: amount },
        { key: 'Include inactive', value: includeInactive ? 'Yes' : 'No' },
      ],
      right: [],
    },
    tables: [
      {
        head: [
          { text: 'Trial number', style: 'label' },
          { text: 'Names', style: 'label' },
          { text: 'Trial type', style: 'label' },
          { text: 'Court', style: 'label' },
          { text: 'Courtroom', style: 'label' },
          { text: 'Judge', style: 'label' },
          { text: 'Start date', style: 'label' },
        ],
        body,
      },
    ],
  }
}
