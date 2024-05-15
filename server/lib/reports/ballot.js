(function() {
  'use strict';

  const pdfMake = require('pdfmake');
  const layout = require('./default-layout');

  const hardData = [
    {id:'123456', firstName:'FirstName', lastName:'lasttName', postcode:'post 1'},
    {id:'222222', firstName:'FirstName', lastName:'FirstName', postcode:'post 2'},
    {id:'333333', firstName:'FirstName', lastName:'FirstName', postcode:'post 3'},
    {id:'444444', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},

    {id:'555523456', firstName:'FirstName', lastName:'FirstName', postcode:'post 1'},
    {id:'6666666', firstName:'FirstName', lastName:'FirstName', postcode:'post 2'},
    {id:'77777777', firstName:'FirstName', lastName:'FirstName', postcode:'post 3'},
    {id:'8888888', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},

    {id:'9999999', firstName:'FirstName', lastName:'FirstName', postcode:'post 1'},
    {id:'1010101010', firstName:'FirstName', lastName:'FirstName', postcode:'post 2'},
    {id:'111111111', firstName:'FirstName', lastName:'FirstName', postcode:'post 3'},
    {id:'12121212', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},

    {id:'13131313', firstName:'FirstName', lastName:'FirstName', postcode:'post 1'},
    {id:'14141414', firstName:'FirstName', lastName:'FirstName', postcode:'post 2'},
    {id:'15151515', firstName:'FirstName', lastName:'FirstName', postcode:'post 3'},
    {id:'16161616', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},

    {id:'555555555', firstName:'FirstName', lastName:'FirstName', postcode:'post 1'},
    {id:'666666666', firstName:'FirstName', lastName:'FirstName', postcode:'post 2'},
    {id:'777777777', firstName:'FirstName', lastName:'FirstName', postcode:'post 3'},
    {id:'16161616', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},

    {id:'888888888', firstName:'FirstName', lastName:'FirstName', postcode:'post 3'},
    {id:'999999999', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},
    {id:'999999999', firstName:'FirstName', lastName:'FirstName', postcode:'post 4'},
  ];

  const topMargin = 3;

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
          heights: [topMargin, 0, 0, 0],
          body: [
            [{ text: ''}],
            [{ text: data.id, bold: true, margin: [30, 30, 0, 0] }],
            [{ text: [
              { text: '\n' + data.firstName, bold: true },
              { text: ', ', bold: true },
              { text: data.lastName, bold: false },
            ], margin: [30, 0, 0, 0],
            }],
            [{text: '\n' + data.postcode, margin: [30, 0, 0, 0]}],
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
    const secondh = 190;
    const third = 346;

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
      style: 'tableExample', 
      pageMargins : [25, 25, 25, 35],     
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
      logo: (isWelsh) => {
        return `./client/assets/images/letterlogo${isWelsh ? '-cy' : ''}.png`;
      },
      defaultStyles: {
        defaultStyle: {
          font: 'OpenSans',
          fontSize: 10,
        },
      },
    };
  };


/**
   *
   * @returns {Promise<Buffer>} the generated pdf document as a buffer
   */
  async function createBallotPDF(jurorData){
    return new Promise((resolve, reject) => {
      const printer = new pdfMake(layout().fonts);
      const chunks = [];

      const _documentContent = [
        { ...documentTableData(hardData) }, // jurorData goes here when hardcoding stops

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

  module.exports.getBallotPDF = async(req, res, jurorData) => {

    const document = await createBallotPDF(jurorData);

    res.contentType('application/pdf');
    return res.send(document);
  };

})();
