(function() {
  'use strict';

  const pdfMake = require('pdfmake');
  const layout = require('./default-layout');

  const documentHeader = {
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
  };

  const documentFooter = (content) => {
    return (current) => {

      let stackPages = 0;
      let stackPage = 0;
      let footerText;

      for (const element of content) {
        const stackFirstpage = element.positions[0]?.pageNumber || 1;
        const stackLastPage = element.positions[element.positions.length - 1]?.pageNumber || 1;

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

  const documentTitle = (title) => {
    if (typeof title === 'string') {
      return {
        text: title,
        style: 'title',
      };
    }

    return title;
  };

  const documentMetadata = (metadata) => {
    const width = metadata.centre ? '33%' : '50%';

    const _column = (content) => {
      if (!content) {
        return undefined;
      } else if (content.length === 0) {
        return {
          width,
          text: '',
        };
      }
      const _body = [];
      const heading = [];

      content.filter(item => item.heading).forEach(item => heading.push({
        text: item.heading,
        style: 'sectionHeading',
      }));

      content.filter(item => item.key).forEach(row => _body.push([
        {
          style: 'label',
          text: row.key,
        },
        {
          text: row.value,
        },
      ]));

      return {
        stack: [
          ...heading,
          {
            width,
            layout: layout().defaultLayout,
            alignment: 'left',
            table: {
              widths: [120, '*'],
              body: _body,
            },
          },
        ],
      };
    };

    return {
      alignment: 'justify',
      style: 'body',
      columnGap: 20,
      columns: [
        _column(metadata.left),
        _column(metadata.centre),
        _column(metadata.right),
      ].filter(i => i),
    };
  };

  // TODO: this can be improved still
  const documentContent = (tables) => {
    const _defaultTableOptions = (modifications, margin) => ({
      alignment: 'left',
      style: 'body',
      layout: {
        ...layout().defaultLayout,
        ...modifications,
      },
      margin: margin || [0, 30, 0, 0],
    });
    const _tables = [];

    tables.forEach(table => {
      if (table.raw) {
        delete table.raw;
        _tables.push({
          layout: {
            ...layout().defaultLayout,
            ...table.layoutMod,
          },
          ...table,
        });
      } else {

        const _body = [];

        if (table.head) {
          _body.push(table.head);
        }

        _body.push(...table.body);

        if (table.footer && table.footer.length) {
          _body.push(table.footer);
        }

        _tables.push({
          ..._defaultTableOptions(table.layout, table.margin),
          ...(table.options || {}),
          table: {
            widths: table.widths || new Array(table.head.length).fill('*'),
            body: _body,
          },
        });
      }
    });

    return _tables;
  };

  const largeTotals = (data) => {
    if (!data) return [];
    return [data];
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
   * @param {Content} content The document content object
   * @param {Options} options Extra options for the document generation
   * @returns {Promise<Buffer>} the generated pdf document as a buffer
   */
  module.exports.generateDocument = (data, options = {}) => {
    return new Promise((resolve, reject) => {
      const _defaultStyles = layout(options.pageOrientation).defaultStyles;
      const printer = new pdfMake(layout().fonts);
      const _documentContent = [];
      const chunks = [];

      const arrayedData = Array.isArray(data) ? data : [data];

      for (const [i, content] of arrayedData.entries()) {
        const title = {
          ...documentTitle(content.title),
        };

        if (i >= 1) {
          title['pageBreak'] = 'before';
        }

        _documentContent.push({
          stack: [
            { ...title },
            { ...documentMetadata(content.metadata) },
            ...largeTotals(content.largeTotals),
            ...(content.preBuilt || documentContent(content.tables)),
          ],
          footerText: content.footerText,
        });
      }

      const finalContent = {
        ..._defaultStyles,
        header: documentHeader,
        content: [ ..._documentContent ],
        styles: layout(null, options.fontSize).otherStyles,
      };

      finalContent.footer = documentFooter(finalContent.content);

      const document = printer.createPdfKitDocument(finalContent);

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
