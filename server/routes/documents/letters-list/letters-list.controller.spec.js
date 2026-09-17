;(function() {
  'use strict';

  const controller = require('./letters-list.controller');

  describe('Letters list controller:', function() {
    const headings = [
      'Juror number',
      'Date printed',
      'hidden_extracted_flag',
      'hidden_form_code',
    ];
    const dataTypes = ['number', 'date', 'hidden', 'hidden'];
    let app;

    beforeEach(function() {
      app = {
        namedRoutes: {
          build: sinon.stub().callsFake((route) => `/${route}`),
        },
        logger: {
          crit: sinon.stub(),
        },
      };
    });

    function getRenderedList(data, documentSearchBy, activeUserType, query = {}) {
      const req = {
        params: { document: 'confirmation' },
        query: { documentSearchBy, ...query },
        session: {
          authentication: {
            userType: activeUserType,
            activeUserType,
          },
          documentsJurorsList: {
            headings,
            dataTypes,
            data,
          },
        },
        url: '/documents/confirmation/letters-list',
      };
      const res = {
        render: sinon.stub(),
      };

      controller.getListLetters(app)(req, res);

      expect(res.render).to.have.been.calledOnce;
      return res.render.firstCall.args[1];
    }

    it('hides Select All and retains Pending and Delete for queued Bureau letters', function() {
      const queuedLetters = Array.from({ length: 26 }, (_, index) => (
        [(123456789 + index).toString(), '2026-09-17', false, '522']
      ));
      const renderedList = getRenderedList(queuedLetters, 'allLetters', 'BUREAU', {
        page: 2,
        sortBy: 'jurorNumber',
        sortOrder: 'ascending',
      });

      expect(renderedList.paginationObject).to.exist;
      expect(renderedList.headings[0].html).not.to.contain('check-all-jurors');
      expect(renderedList.headings[0].html).not.to.contain('Select All');
      expect(renderedList.rows[0][0]).to.deep.equal({});
      expect(renderedList.rows[0][2].html).to.contain('Pending');
      expect(renderedList.rows[0][2].html).to.contain('Delete');
    });

    it('hides Select All for pending-only Bureau results', function() {
      const renderedList = getRenderedList([
        ['123456789', '2026-09-17', false, '522'],
      ], 'jurorNumber', 'BUREAU');

      expect(renderedList.totalCheckableJurors).to.equal(0);
      expect(renderedList.headings[0].html).not.to.contain('check-all-jurors');
    });

    it('retains bulk and individual selection for eligible Bureau results', function() {
      const renderedList = getRenderedList([
        ['123456789', '2026-09-17', false, '522'],
        ['987654321', null, false, '522'],
      ], 'jurorNumber', 'BUREAU');

      expect(renderedList.totalCheckableJurors).to.equal(1);
      expect(renderedList.headings[0].html).to.contain('check-all-jurors');
      expect(renderedList.rows[0][0]).to.deep.equal({});
      expect(renderedList.rows[1][0].html).to.contain('id="juror-987654321"');
    });

    it('leaves court selection and table alignment unchanged', function() {
      const renderedList = getRenderedList([
        ['123456789', '2026-09-17', false, '522'],
      ], 'jurorNumber', 'COURT');

      expect(renderedList.headings[0]).to.deep.include({
        id: 'check-all-juror',
        html: '',
      });
      expect(renderedList.rows[0][0].html).to.contain('id="juror-123456789"');
      expect(renderedList.rows[0]).to.have.length(renderedList.headings.length);
    });
  });
})();
