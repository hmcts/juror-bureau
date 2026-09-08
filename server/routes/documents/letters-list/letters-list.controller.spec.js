;(function() {
  'use strict';

  const controller = require('./letters-list.controller');

  describe('Letters list Controller:', function() {
    let app;
    let res;

    beforeEach(function() {
      app = {
        logger: {
          crit: sinon.stub(),
        },
        namedRoutes: {
          build: sinon.stub().returns('/documents'),
        },
      };
      res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
      };
    });

    it('does not show Select All for Bureau letters queued for printing', function() {
      const renderData = renderLettersList({
        app,
        res,
        documentSearchBy: 'allLetters',
        userType: 'BUREAU',
        data: [pendingLetter('111111111')],
      });

      expect(renderData.headings[0].html).to.equal('');
      expect(renderData.rows[0][0]).to.deep.equal({});
      expect(renderData.rows[0]).to.have.length(3);
      expect(renderData.rows[0][2].html).to.include('Pending');
      expect(renderData.rows[0][2].html).to.include('Delete');
    });

    it('does not show Select All for a pending-only Bureau search', function() {
      const renderData = renderLettersList({
        app,
        res,
        documentSearchBy: 'jurorNumber',
        userType: 'BUREAU',
        data: [pendingLetter('222222222')],
      });

      expect(renderData.totalCheckableJurors).to.equal(0);
      expect(renderData.headings[0].html).to.equal('');
      expect(JSON.stringify(renderData.headings)).not.to.include('Select All');
    });

    it('shows Select All and individual checkboxes for eligible Bureau results', function() {
      const renderData = renderLettersList({
        app,
        res,
        documentSearchBy: 'jurorNumber',
        userType: 'BUREAU',
        data: [pendingLetter('333333333'), printedLetter('444444444')],
      });

      expect(renderData.totalCheckableJurors).to.equal(1);
      expect(renderData.headings[0].html).to.include('id="check-all-jurors"');
      expect(renderData.headings[0].html).to.include('Select All');
      expect(renderData.rows[0][0]).to.deep.equal({});
      expect(renderData.rows[1][0].html).to.include('id="juror-444444444"');
    });

    it('leaves Court document list selection unchanged', function() {
      const renderData = renderLettersList({
        app,
        res,
        documentSearchBy: 'jurorNumber',
        userType: 'COURT',
        data: [{
          jurorNumber: '555555555',
          datePrinted: '2026-09-01',
          id: 1,
        }],
        headings: ['Juror number', 'Date printed', 'Row Id'],
        dataTypes: ['number', 'date', 'hidden'],
      });

      expect(renderData.headings[0].html).to.equal('');
      expect(renderData.rows[0][0].html).to.include('id="juror-555555555"');
    });
  });

  function renderLettersList({
    app,
    res,
    documentSearchBy,
    userType,
    data,
    headings = ['Juror number', 'Date printed', 'hidden_extracted_flag', 'hidden_form_code'],
    dataTypes = ['number', 'date', 'hidden', 'hidden'],
  }) {
    const req = {
      params: {
        document: 'initial-summons',
      },
      query: {
        documentSearchBy,
        jurorNumber: '111111111',
      },
      session: {
        authentication: {
          userType,
          activeUserType: userType,
        },
        documentsJurorsList: {
          headings,
          dataTypes,
          data,
          checkedJurors: [],
        },
      },
      url: '/documents',
    };

    controller.getListLetters(app)(req, res);

    expect(res.render).to.have.been.calledOnce;
    expect(res.render.firstCall.args[0]).to.equal('documents/_common/letters-list.njk');

    return res.render.firstCall.args[1];
  }

  function pendingLetter(jurorNumber) {
    return [jurorNumber, '2026-09-01', false, '5224'];
  }

  function printedLetter(jurorNumber) {
    return [jurorNumber, '2026-09-01', true, '5224'];
  }
})();
