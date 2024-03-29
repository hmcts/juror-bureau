const pdfMake = require('pdfmake');
const layout = require('./default-layout');

const documentHeader = () => {
  return {
    stack: [
      {
        columns: [
          {
            image: layout().logo,
            width: 30,
          },
          {
            text: [
              {
                text: 'HMCTS ',
              },
              {
                text: 'Juror',
                bold: false,
              },
            ],
          },
        ],
        style: 'header',
        columnGap: 10,
      },
    ],
  };
};

const documentFooter = (content) => {
  return (current) => {

    let stackPages = 0;
    let stackPage = 0;
    let footerText;

    for (const element of content) {
      const stackFirstpage = element.positions[0].pageNumber;
      const stackLastPage = element.positions[element.positions.length - 1].pageNumber;

      if (current >= stackFirstpage && current <= stackLastPage) {
        stackPages = stackLastPage - stackFirstpage + 1;
        stackPage = current - stackFirstpage + 1;
        footerText = element.footerText;
        break;
      }
    }

    if (stackPages) {
      return {
        marginTop: 10,
        style: 'footer',
        columns: [
          {
            text: footerText,
            marginLeft: 20,
          },
          {
            text: `Page ${stackPage} of ${stackPages}`,
            alignment: 'right',
            marginRight: 20,
          },
        ],
      };
    }
    return { text: '', margin: [55, 0, 0, 0] };
  };
};

const horizontalLine = () => {
  return {
    table: {
      widths: ['*'],
      body: [[''], ['']],
    },
    layout: {
      hLineWidth: (i, node) => {
        return (i === 0 || i === node.table.body.length) ? 0 : 1;
      },
      vLineWidth: () => {
        return 0;
      },
    },
  };
};

const documentMetadata = (metadata) => {
  const _column = (content) => {
    const _body = [];

    if (typeof content === 'undefined') {
      return {
        width: '33%',
        layout: layout().defaultLayout,
        alignment: 'left',
        table: {
          widths: [],
          body: [[]],
        },
        marginBottom: 10,
      };
    }

    Object.keys(content).forEach((key) => _body.push([
      {
        style: 'label',
        text: key,
      },
      {
        text: content[key],
      },
    ]));

    return {
      width: '33%',
      layout: layout().defaultLayout,
      alignment: 'left',
      table: {
        widths: [120, '*'],
        body: _body,
      },
      marginBottom: 10,
    };
  };

  return {
    alignment: 'justify',
    style: 'body',
    columnGap: 20,
    columns: [
      _column(metadata.left),
      _column(),
      _column(metadata.right),
    ],
  };
};

const documentContent = (table) => {
  const _defaultTableOptions = {
    alignment: 'left',
    style: 'body',
    layout: layout().defaultLayout,
    marginTop: 10,
  };

  const _tables = [];
  const _body = [];

  _body.push(table.head);
  _body.push(...table.body);

  _tables.push({
    ..._defaultTableOptions,
    table: {
      // TODO: the widths could be personalised based on what table we want to build
      widths: [80, '*', '*', 30, '*', 30, '*', '*', '*', '*', '*', 40, '*', 30, 40],
      body: _body,
    },
  });

  return _tables;
};

/**
 * @typedef {object} Content
 * @property {string} title document title to show on top of the document
 * @property {string} footerText text shown at the footer (mostly be the same as the title???)
 * @property {object} metadata
 * @property {Array} tables
 */

/**
 * @typedef {object} Options
 * @property {'portrait' | 'landscape'} pageOrientation property to override the default page orientation
 */

/**
 *
 * @param {Content} bulkData The document content object
 * @param {Options} options Extra options for the document generation
 * @returns {Promise<Buffer>} the generated pdf document as a buffer
 */
module.exports.generateDocument = (bulkData, options = {}) => {
  return new Promise((resolve, reject) => {
    const _defaultStyles = layout(options.pageOrientation).defaultStyles;
    const printer = new pdfMake(layout().fonts);
    const _documentContent = [];
    const chunks = [];

    for (const [i, data] of bulkData.entries()) {
      const title = {
        ...data.header,
      };

      if (i >= 1) {
        title['pageBreak'] = 'before';
      }

      _documentContent.push({
        stack: [
          { ...title },
          { ...horizontalLine() },
          { ...documentMetadata(data.metadata) },
          { ...horizontalLine() },
          ...documentContent(data.content),
        ],
        footerText: data.footer,
      });
    }

    const dd = {
      ..._defaultStyles,
      header: documentHeader(),
      content: [ ..._documentContent ],
      styles: layout().otherStyles,
    };

    dd.footer = documentFooter(dd.content);

    const document = printer.createPdfKitDocument(dd);

    document.on('data', (data) => {
      chunks.push(data);
    });

    document.on('end', () => {
      return resolve(Buffer.concat(chunks));
    });

    document.on('error', (error) => {
      return reject(error);
    });

    document.end();
  });
};
