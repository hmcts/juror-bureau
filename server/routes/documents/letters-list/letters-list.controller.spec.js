;(function() {
  'use strict';

  const controller = require('./letters-list.controller');
  const headings = [
    'Juror number',
    'Name',
    'Date printed',
    'hidden_extracted_flag',
    'hidden_form_code',
  ];
  const dataTypes = ['number', 'text', 'date', 'hidden', 'hidden'];

  describe('Letters list Controller:', function() {
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

    it('does not render Select All for queued Bureau letters', function() {
      const pendingLetter = ['111111111', 'Pending Juror', '2026-09-01', false, '5224'];
      const renderModel = renderLettersList(app, 'BUREAU', 'allLetters', [pendingLetter]);

      expect(renderModel.headings[0].html).not.to.contain('check-all-jurors');
      expect(renderModel.rows[0][0]).to.deep.equal({});
      expect(renderModel.rows[0][3].html).to.contain('Pending');
      expect(renderModel.rows[0][3].html).to.contain('Delete');
      expect(renderModel.totalCheckableJurors).to.equal(1);
    });

    it('does not render Select All for pending-only Bureau results', function() {
      const pendingLetter = ['111111111', 'Pending Juror', '2026-09-01', false, '5224'];
      const renderModel = renderLettersList(app, 'BUREAU', 'jurorNumber', [pendingLetter]);

      expect(renderModel.headings[0].html).not.to.contain('check-all-jurors');
      expect(renderModel.totalCheckableJurors).to.equal(0);
    });

    it('retains bulk and individual selection for selectable Bureau results', function() {
      const pendingLetter = ['111111111', 'Pending Juror', '2026-09-01', false, '5224'];
      const printedLetter = ['222222222', 'Printed Juror', '2026-08-01', true, '5224'];
      const renderModel = renderLettersList(
        app,
        'BUREAU',
        'jurorNumber',
        [pendingLetter, printedLetter],
      );

      expect(renderModel.headings[0].html).to.contain('check-all-jurors');
      expect(renderModel.rows[0][0]).to.deep.equal({});
      expect(renderModel.rows[1][0].html).to.contain('check-juror-222222222');
      expect(renderModel.totalCheckableJurors).to.equal(1);
    });

    it('does not add Select All to court results', function() {
      const courtLetter = {
        jurorNumber: '333333333',
        name: 'Court Juror',
        datePrinted: '2026-08-01',
        hiddenExtractedFlag: true,
        hiddenFormCode: '5224',
        id: 1,
      };
      const renderModel = renderLettersList(app, 'COURT', 'jurorNumber', [courtLetter]);

      expect(renderModel.headings[0].html).not.to.contain('check-all-jurors');
      expect(renderModel.rows[0][0].html).to.contain('check-juror-333333333');
    });
  });

  function renderLettersList(app, userType, documentSearchBy, data) {
    const req = {
      params: { document: 'initial-summons' },
      query: { documentSearchBy },
      session: {
        authentication: {
          userType,
          activeUserType: userType,
        },
        documentsJurorsList: {
          headings,
          dataTypes,
          data,
        },
      },
      url: `/documents/initial-summons?documentSearchBy=${documentSearchBy}`,
    };
    const res = {
      render: sinon.stub(),
    };

    controller.getListLetters(app)(req, res);

    expect(res.render).to.have.been.calledOnce;
    expect(res.render.firstCall.args[0]).to.equal('documents/_common/letters-list.njk');

    return res.render.firstCall.args[1];
  }
})();
