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
      data.courtAddressLine1,
      data.courtAddressLine2,
      data.courtAddressLine3,
      data.courtAddressLine4,
      data.courtAddressLine5,
      data.courtAddressLine6,
      data.courtPostCode,
    ];
  }

  function jurorAddress(data) {
    return [
      data.jurorAddressLine1,
      data.jurorAddressLine2,
      data.jurorAddressLine3,
      data.jurorAddressLine4,
      data.jurorAddressLine5,
      data.jurorPostcode,
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
              text: [
                {
                  text: content.jurorFirstName + ' ' + content.jurorLastName + '\n',
                },
                buildAddress(jurorAddress(content)),
              ],
              marginTop: 55,
              marginBottom: 40,
            },
          ],
        },
        {
          stack: [
            {
              text: [
                {
                  text: `${content.courtName}\n\n`,
                  style: {
                    bold: true,
                  },
                },
                {
                  ...buildAddress(courtAddress(content)),
                },
                {
                  text: [
                    `\n${content.welsh ? 'Rhif Ffôn.' : 'Telephone No.'} ${content.courtPhoneNumber}`,
                    // `\n${content.welsh ? 'Rhif Ffacs.' : 'Fax No.'} ${content.courtFaxNumber || 'N/A'}`,
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
                text: `${content.welsh ? 'Eich rhif fel rheithiwr:' : 'Your Ref:'} ${content.jurorNumber}`,
              },
            ],
            alignment: 'right',
          },
        ],
      },
      {
        text: (typeof jurorData.documentType !== 'undefined' && jurorData.documentType === 'certificate-attendance')
          ? '' : `${content.welsh
            ? 'Annwyl' : 'Dear'} ${content.jurorFirstName} ${content.jurorLastName},`,
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

    contentArray.push({ text: content.content });

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
          stack: [
            {
              text: content.welsh ? '\nYn gywir,\n\n' : '\nYours sincerely,\n\n',
            },
            {
              text: content.signature,
              marginTop: 50,
            }
          ],
        });
      }
    } else {
      contentArray.push({ text: content.signature, marginTop: 50 });
    }

    return contentArray;
  };

  function documentFooter(content) {
    return (current) => {
      let stackPages = 0;
      let stackPage = 0;
      const columns = [];

      for (const element of content) {
        const stackFirstpage = element.positions[0].pageNumber;
        const stackLastPage = element.positions[element.positions.length - 1].pageNumber;

        if (current >= stackFirstpage && current < stackLastPage) {
          stackPages = stackLastPage - stackFirstpage + 1;
          stackPage = current - stackFirstpage + 1;

          columns.push({
            text: `Page ${stackPage} of ${stackPages}`,
            alignment: 'right',
            marginRight: 50,
          });

          break;
        }

        if (current === stackLastPage) {
          stackPages = stackLastPage - stackFirstpage + 1;
          stackPage = current - stackFirstpage + 1;

          columns.push(
            {
              text: `Page ${stackPage} of ${stackPages}`,
              alignment: 'right',
              marginRight: 50,
            },
          );

          break;
        }
      }

      if (stackPages) {
        return {
          marginLeft: 50,
          marginBottom: 50,
          columns,
        };
      }
      return { text: '', margin: [55, 0, 0, 0] };
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
