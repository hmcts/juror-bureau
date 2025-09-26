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
    const pages = [];
    const rowHeight = 200;
    const cardsPerPage = 8; // 2 across x 4 down

    // If no data, return one blank page
    if (!data || data.length === 0) {
      const body = [
        [getEmptyTableCell(), getEmptyTableCell()],
        [getEmptyTableCell(), getEmptyTableCell()],
        [getEmptyTableCell(), getEmptyTableCell()],
        [getEmptyTableCell(), getEmptyTableCell()],
      ];
      const heights = [rowHeight, rowHeight, rowHeight, rowHeight];
      pages.push({ layout: 'noBorders', pageMargins: [25, 25, 25, 25], table: { widths: ['50%', '50%'], heights, body } });
      return pages;
    }

    for (let i = 0; i < data.length; i += cardsPerPage) {
      const body = [];

      // Build 4 rows per page, each row has two cards
      for (let r = 0; r < 4; r++) {
        const leftIndex = i + (r * 2);
        const rightIndex = leftIndex + 1;

        const leftCell = leftIndex < data.length ? getTableCell(data[leftIndex]) : getEmptyTableCell();
        const rightCell = rightIndex < data.length ? getTableCell(data[rightIndex]) : getEmptyTableCell();

        body.push([leftCell, rightCell]);
      }

      const heights = [rowHeight, rowHeight, rowHeight, rowHeight];

      const pageObj = { layout: 'noBorders', pageMargins: [25, 25, 25, 25], table: { widths: ['50%', '50%'], heights, body } };
      if (i + cardsPerPage < data.length) pageObj.pageBreak = 'after';

      pages.push(pageObj);
    }

    return pages;
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

      const _documentContent = [ ...documentTableData(jurors) ];

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

      return res.render('_errors/generic', { err });
    }
  };

})();
