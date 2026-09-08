;(function() {
  'use strict';

  const controller = require('./letters-list.controller');

  describe('Letters list controller:', function() {
    const headings = [
      'Juror number',
      'Juror name',
      'Date printed',
      'hidden_extracted_flag',
      'hidden_form_code',
    ];
    const dataTypes = ['number', 'text', 'date', 'hidden', 'hidden'];
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

    function getRenderModel(activeUserType, documentSearchBy, data) {
      const req = {
        params: { document: 'initial-summons' },
        query: { documentSearchBy },
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
        url: '/documents/initial-summons/letters-list',
      };
      const res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
      };

      controller.getListLetters(app)(req, res);

      expect(res.render).to.have.been.calledOnce;
      return res.render.firstCall.args[1];
    }

    it('should omit Select All for queued Bureau letters and retain Pending and Delete cells', function() {
      const model = getRenderModel('BUREAU', 'allLetters', [
        ['123456789', 'Juror One', '2026-09-08', false, '0012'],
      ]);

      expect(model.headings[0].html).not.to.contain('check-all-jurors');
      expect(model.headings[0].html).not.to.contain('Select All');
      expect(model.rows[0]).to.have.length(model.headings.length);
      expect(model.rows[0][0]).to.deep.equal({});
      expect(model.rows[0][3].html).to.contain('Pending');
      expect(model.rows[0][3].html).to.contain('Delete');
    });

    it('should omit Select All for Bureau results with no checkable letters', function() {
      const model = getRenderModel('BUREAU', 'jurorNumber', [
        ['123456789', 'Juror One', '2026-09-08', false, '0012'],
      ]);

      expect(model.totalCheckableJurors).to.equal(0);
      expect(model.headings[0].html).not.to.contain('check-all-jurors');
      expect(model.headings[0].html).not.to.contain('Select All');
    });

    it('should retain individual and bulk selection for checkable Bureau results', function() {
      const model = getRenderModel('BUREAU', 'jurorNumber', [
        ['123456789', 'Juror One', '2026-09-07', true, '0012'],
        ['987654321', 'Juror Two', '2026-09-08', false, '0012'],
      ]);

      expect(model.totalCheckableJurors).to.equal(1);
      expect(model.headings[0].html).to.contain('check-all-jurors');
      expect(model.headings[0].html).to.contain('Select All');
      expect(model.rows[0][0].html).to.contain('id="juror-123456789"');
      expect(model.rows[1][0]).to.deep.equal({});
    });

    it('should leave Court results without the Bureau Select All control', function() {
      const model = getRenderModel('COURT', 'jurorNumber', [
        ['123456789', 'Juror One', '2026-09-07', true, '0012'],
      ]);

      expect(model.headings[0].html).not.to.contain('check-all-jurors');
      expect(model.headings[0].html).not.to.contain('Select All');
      expect(model.rows[0][0].html).to.contain('id="juror-123456789"');
    });
  });
})();
