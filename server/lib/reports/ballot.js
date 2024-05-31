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
          body: [''],
        },        
        layout: 'noBorders',
      },
    ];
  };

  const getTableCell = (data) => {
    return [
      {
        border: [false, false, false, false],        
        table: {
          body: [
            [{ text: ' ', fontSize: topMargin }],
            [{ text: data.id, bold: true, margin: [30, 0, 0, 0] }],
            [{ text: [
              { text: '\n' + data.firstName, bold: true },
              { text: ', ', bold: true },
              { text: data.lastName, bold: false },
            ], margin: [30, 0, 0, 0],
            }],
            [{ text: '\n' + data.postcode, margin: [30, 0, 0, 0] }],
          ],
        },
        layout: 'noBorders',
      },
    ];
  };

  const documentTableData = (data) => {
    const body=[];
    const heights = [];
    const firsth = 300;
    const secondh = 195;
    const third = 360;

    for (let i = 0; i < data.length; i = i + 2) {
      const row = [];

      if (i === 0){
        heights.push(firsth);
      } else {
        heights.push(secondh);
      }

      row.push(getTableCell(data[i]));

      if (i+1 < data.length){
        if (i === 0){
          heights.push(firsth);
        } else {
          heights.push(third);
        }

        row.push(getTableCell(data[i+1]));
      } else{
        row.push(getEmptyTableCell());
      }

      body.push(row);
    }
    return {
      layout: 'noBorders',
      pageMargins : [25, 25, 25, 25],
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
          fontSize: 12,
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
        pageOrientation: 'landscape',
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
