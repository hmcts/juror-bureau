(function() {
  'use strict';

  const pdfMake = require('pdfmake');
  const layout = require('./default-layout');
  const topMargin = 15;

  const getEmptyTableCell = () => {
    return [
      {
        border: [false, false, false, false],
        table: {
          heights: [topMargin],
          body: [[]],
        },        
        layout: 'noBorders',
      },
    ];
  };

  const getTableCell = ({ id, firstName, lastName, postcode }) => {
    return [
      {
        border: [false, false, false, false],        
        table: {
          body: [
            [{ text: ' ', fontSize: topMargin }],
            [{ text: id, bold: true, margin: [40, 0, 0, 0] }],
            [
              { text: (firstName && lastName ? [
                { text: '\n' + firstName, bold: false },
                { text: ', ', bold: true },
                { text: lastName, bold: true },
                ] : ''), margin: [40, -15, 0, 0],
              },
            ],
            [{ text: '\n' + (postcode ?? ''), margin: [40, -15, 0, 0] }],
          ],
        },
        layout: 'noBorders',
      },
    ];
  };

  const documentTableData = (data) => {
    const body=[];
    const heights = [];
    const tracker = [];
    const pageBreakHeight = 120;
    const rowHeight = 200;

    for (let i = 0; i < data.length; i = i + 2) {
      const row = [];

      if (i !== 0 && i % 8 === 0){
        heights.push(pageBreakHeight);
        tracker.push(i);
      } else {
        heights.push(rowHeight);
        tracker.push(i);
      }

      row.push(getTableCell(data[i]));

      if (i+1 < data.length){
        row.push(getTableCell(data[i+1]));
      } else{
        row.push(getEmptyTableCell());
      }

      body.push(row);
    }

    if (!data.length) {
      body.push([getEmptyTableCell(), getEmptyTableCell()])
      heights.push(rowHeight);
    } else {
      switch(data.length % 8) {
        case 1:
        case 3:
        case 5:
          body.push([getEmptyTableCell(), getEmptyTableCell()])
          heights.push(rowHeight);
      }
    }

    return {
      layout: 'noBorders',
      pageMargins: [25, 25, 25, 25],
      table: {
        widths: ['50%', '50%'],
        heights,
        body,
      },
    };
  };

  function defaultStyles() {
    return {
      fonts: { ...layout().fonts },
      defaultStyles: {
        defaultStyle: {
          font: 'OpenSans',
          fontSize: 14,
        },
      },
    };
  };

  async function createBallotPDF(jurors) {
    return new Promise((resolve, reject) => {
      const printer = new pdfMake(layout().fonts);
      const chunks = [];

      const _documentContent = [
        { ...documentTableData(jurors) }, // jurorData goes here when hardcoding stops
      ];

      const pdfOptions = {
        ...defaultStyles().defaultStyles,
        content: [ ..._documentContent ],
        styles: layout().otherStyles,
        pageOrientation: 'portrait',
        pageMargins: 0,
      };

      const document = printer.createPdfKitDocument(pdfOptions);

      document.on('data', function(data) {
        chunks.push(data);
      });

      document.on('end', function() {
        return resolve(Buffer.concat(chunks));
      });

      document.on('error', function(error) {
        return reject(error);
      });

      document.end();
    });
  };

  module.exports.getBallotPDF = async(app, req, res, jurors) => {
    try {
      const document = await createBallotPDF(jurors);
      
      res.contentType('application/pdf');
      return res.send(document);
    } catch (err) {
      app.logger.crit('Failed when creating ballot PDF', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }
  };

})();
