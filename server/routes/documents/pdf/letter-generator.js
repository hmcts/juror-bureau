(function() {
  'use strict';

  const pdfMake = require('pdfmake');
  const layout = require('../../../lib/reports/default-layout');
  const { formatLetterDate } = require('../../../lib/mod-utils');

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
        pageMargins: [50, 50, 50, 50],
      },
    };
  }

  function buildAddress(lines) {
    const isNotBlank = (line) => line;

    return { text: lines.filter(isNotBlank).join('\n') };
  };

  function courtAddress(data) {
    return [
      data.court_address_line1,
      data.court_address_line2,
      data.court_address_line3,
      data.court_address_line4,
      data.court_address_line5,
      data.court_address_line6,
      data.court_post_code,
    ];
  }

  function jurorAddress(data) {
    return [
      data.juror_address_line1,
      data.juror_address_line2,
      data.juror_address_line3,
      data.juror_address_line4,
      data.juror_address_line5,
      data.juror_postcode,
    ];
  }

  function documentHeader(content, i) {
    return {
      columns: [
        {
          stack: [
            {
              image: defaultStyles().logo(content.welsh),
              width: 120,
            },
            {
              ...buildAddress(jurorAddress(content)),
              marginTop: 30,
              marginBottom: 30,
            },
          ],
        },
        {
          stack: [
            {
              text: [
                {
                  text: `${content.court_name}\n\n`,
                  style: {
                    bold: true,
                  },
                },
                {
                  ...buildAddress(courtAddress(content)),
                },
                {
                  text: [
                    `\n${content.welsh ? 'Rhif Ffôn.' : 'Telephone No.'} ${content.court_phone_number}`,
                    // `\n${content.welsh ? 'Rhif Ffacs.' : 'Fax No.'} ${content.court_fax_number || 'N/A'}`,
                  ],
                },
              ],
              style: {
                alignment: 'right',
              },
            },
          ],
        },
      ],
      pageBreak: i >= 1 ? 'before': '',
    };
  }

  function documentContent(content, jurorData) {
    const isWelsh = content.welsh;
    const contentArray = [
      {
        columns: [
          {
            text: `${content.welsh ? 'Dyddiad:' : 'Date:'} ${formatLetterDate(new Date(), 'D MMMM YYYY', isWelsh)}`,
          },
          {
            stack: [
              {
                text: `${content.url}\n`,
                bold: true,
                marginTop: -21,
                marginBottom: 5,
              },
              {
                text: `${content.welsh ? 'Eich rhif fel rheithiwr:' : 'Your Ref:'} ${content.juror_number}`,
              },
            ],
            alignment: 'right',
          },
        ],
      },
      {
        text: (typeof jurorData.documentType !== 'undefined' && jurorData.documentType === 'certificate-attendance')
          ? '' : `${content.welsh
            ? 'Annwyl' : 'Dear'} ${content.juror_first_name} ${content.juror_last_name},`,
        marginTop: 15,
      },
      {
        text: content.title,
        bold: true,
        marginTop: 15,
        marginBottom: 30,
      },
    ];

    if (content.subTitle) {
      contentArray.push({
        text: content.subTitle,
        bold: true,
        marginTop: 15,
        marginBottom: 15,
      });
    }

    contentArray.push({
      text: content.content,
    });
    if (typeof jurorData.table !== 'undefined') {
      contentArray.push(
        {
          style: 'tableExample',
          table: jurorData.table,
          layout: 'noBorders',
        }
      );

      if (content.signature) {
        contentArray.push({
          text: content.signature,
          marginTop: 20,
          marginBottom: 15,
        });
      }
    };

    return contentArray;
  };

  function documentFooter(content) {
    return (current) => {
      return {
        marginLeft: 50,
        marginBottom: 50,
        stack: [
          {
            text: content[current - 1].signature,
          },
        ],
      };
    };
  };

  module.exports.generateDocument = (content) => {
    return new Promise((resolve, reject) => {
      const printer = new pdfMake(defaultStyles().fonts);
      const chunks = [];
      const _documentContent = [];

      for (const [i, data] of content.entries()) {
        _documentContent.push({
          stack: [
            { ...documentHeader(data, i) },
            ...documentContent(data, content[i]),
          ],
          signature: data.signature,
        });
      }

      const documentPages = {
        ...defaultStyles().defaultStyles,
        content: [ ..._documentContent ],
      };

      documentPages.footer = documentFooter(documentPages.content);

      const document = printer.createPdfKitDocument({
        ...defaultStyles().defaultStyles,
        ...documentPages,
      });

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

})();
