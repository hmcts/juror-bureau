const { generateDocument } = require('../../../lib/reports/single-generator');

const buildReportHeadings = (headings) => headings.map(heading => {
  if (heading === '') {
    return null;
  }

  return { key: heading.title, value: heading.data };
});

const borderColor = ['#b1b4b6', '#b1b4b6', '#b1b4b6', '#b1b4b6'];

const stylings = {
  heading: { fontSize: 14, bold: true },
  noBorders: { border: [false, false, false, false] },
  blackBg: { fontSize: 10, fillColor: '#0b0c0c', color: '#ffffff' },
  grayBg: { fontSize: 10, fillColor: '#f3f2f1' },
  whiteBg: { fontSize: 10, fillColor: '#ffffff' },
  leftCol: { bold: true, width: '80%' },
  borderLeft: { border: [true, false, false, false], borderColor },
  borderRight: { border: [false, false, true, false], borderColor },
  borderBottom: { border: [false, false, false, true], borderColor },
};

const emptyColumn = (options = {}) => ({ text: '', ...stylings.noBorders, ...options });

const blackColumn = (label, amount, options = {}) => (
  {
    columns: [{ text: label, ...stylings.leftCol }, { text: amount }],
    ...stylings.noBorders,
    ...stylings.blackBg,
    ...options,
  }
);

const grayColumn = (label, amount, options = {}) => (
  {
    columns: [{ text: label, ...stylings.leftCol }, { text: amount }],
    ...stylings.borderBottom,
    ...stylings.grayBg,
    ...options,
  }
);

const whiteColumn = (label, amount, options = {}) => (
  {
    columns: [{ text: label, ...stylings.leftCol }, { text: amount }],
    ...stylings.borderBottom,
    ...stylings.whiteBg,
    ...options,
  }
);

const groupTitle = (title) => (
  {
    table: {
      widths: ['*'],
      body: [[{
        text: title,
        ...stylings.heading,
        marginTop: 8,
        border: [false, false, false, true],
      }]],
    },
  }
);

const buildSummoningColumns = (data) => {
  return [
    groupTitle('Summoning'),
    {
      table: {
        widths: ['*', 5, '*'],
        body: [
          [
            blackColumn('Total jurors summoned', data.totalJurorsNeeded),
            emptyColumn(),
            grayColumn('Initially summoned', data.initiallySummoned),
          ],
          [
            whiteColumn('Bureau deferrals included', data.bureauDeferralsIncluded),
            emptyColumn(),
            grayColumn('Ratio', data.ratio),
          ],
          [
            whiteColumn('Bureau to supply', data.bureauToSupply),
            emptyColumn(),
            grayColumn('Additional summons issued', data.additionalSummonsIssued),
          ],
          [
            emptyColumn(),
            emptyColumn(),
            grayColumn('Reminder letters issued', data.reminderLettersIssued),
          ],
        ],
      },
    },
  ];
};

const buildAvailableColumns = (data) => {
  return [
    groupTitle('Available'),
    {
      table: {
        widths: ['*', 5, '*'],
        body: [
          [
            blackColumn('Total confirmed jurors', data.totalConfirmedJurors),
            emptyColumn(),
            grayColumn('Deferrals refused', data.deferralsRefused),
          ],
          [
            emptyColumn(),
            emptyColumn(),
            grayColumn('Excusals refused', data.excusalsRefused),
          ],
        ],
      },
    },
  ];
};

const buildUnavailableColumns = (data) => {
  return [
    groupTitle('Unavailable'),
    {
      table: {
        widths: ['*', 5, '*'],
        body: [
          [
            blackColumn('Total unavailable', data.totalUnavailable),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Non responded', data.nonResponded),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Undeliverable', data.undeliverable),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Awaiting information', data.awaitingInformation),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Disqualified (police check)', data.disqualifiedPoliceCheck),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Disqualified (other)', data.disqualifiedOther),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Deferred', data.deferred),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Postponed', data.postponed),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            whiteColumn('Excused', data.totalExcused, {
              border: [true, true, true, false],
              borderColor,
            }),
            emptyColumn(),
            emptyColumn(),
          ],
          [
            grayColumn('Bereavement', data.bereavement, { ...stylings.borderLeft }),
            emptyColumn({
              border: [false, true, false, false],
              borderColor,
            }),
            grayColumn('Language difficulties', data.languageDifficulties, {
              border: [false, true, true, false],
              borderColor,
            }),
          ],
          [
            grayColumn('Carer', data.carer, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Medical', data.medical, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Childcare', data.childcare, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Mental health', data.mentalHealth, { ...stylings.borderRight }),
          ],
          [
            grayColumn('CJS Employee', data.cjsEmployment, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Moved from area', data.movedFromArea, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Criminal record', data.criminalRecord, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Other', data.other, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Deceased', data.deceased, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Personal engagement', data.personalEngagement, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Deferred by court (too many jurors)', data.deferredByCourt, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Postponement of service', data.postponementOfService, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Excused by Bureau (too many jurors)', data.excusedByBureau, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Recently served', data.recentlyServed, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Financial hardship', data.financialHardship, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Religious reasons', data.religiousReasons, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Forces', data.forces, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Student', data.student, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Holiday', data.holiday, { ...stylings.borderLeft }),
            emptyColumn(),
            grayColumn('Travelling difficulties', data.travellingDifficulties, { ...stylings.borderRight }),
          ],
          [
            grayColumn('Ill', data.ill, {
              border: [true, false, false, true],
              borderColor,
            }),
            emptyColumn({
              border: [false, false, false, true],
              borderColor,
            }),
            grayColumn('Work-related', data.workRelated, {
              border: [false, false, true, true],
              borderColor,
            }),
          ],
        ],
      },
    },
  ];
};

module.exports = async function (app, req, res, reportData, { pageHeadings, data }) {
  try {
    const document = await generateDocument({
      title: reportData.title,
      footerText: reportData.title,
      metadata: {
        left: [...buildReportHeadings(pageHeadings.filter((_, index) => index % 2 === 0)).filter(item => item)],
        right: [...buildReportHeadings(pageHeadings.filter((_, index) => index % 2 === 1)).filter(item => item)],
      },
      preBuilt: [
        buildSummoningColumns(data),
        buildAvailableColumns(data),
        buildUnavailableColumns(data),
      ],
    }, { fontSize: 10 });

    res.contentType('application/pdf');
    return res.send(document);
  } catch (err) {
    app.logger.crit('Something went wrong when generating the report', {
      auth: req.session.authentication,
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    return res.render('_errors/generic.njk');
  }
};
