(function() {
  'use strict';

  const controller = require('./letters-list.controller');

  describe('Documents - letters list controller', function() {
    let app;
    let res;

    beforeEach(function() {
      app = {
        logger: {
          crit: sinon.stub(),
        },
        namedRoutes: {
          build: sinon.stub().callsFake((name) => `/${name}`),
        },
      };
      res = {
        redirect: sinon.stub(),
        render: sinon.stub(),
      };
    });

    it('hides Select All for queued bureau letters while retaining pending actions', function() {
      const req = buildRequest('BUREAU', {
        documentSearchBy: 'allLetters',
      }, bureauList([
        bureauLetter('100000001', '2026-09-20', false),
      ]));

      controller.getListLetters(app)(req, res);

      const model = renderModel(res);
      const tableHtml = JSON.stringify([model.headings, model.rows]);

      expect(tableHtml).not.to.contain('check-all-jurors');
      expect(tableHtml).not.to.contain('Select All');
      expect(tableHtml).to.contain('Pending');
      expect(tableHtml).to.contain('Delete');
      expect(tableHtml).not.to.contain('name=\\\"checked-jurors\\\"');
    });

    it('hides Select All on a sorted later page of queued bureau letters', function() {
      const letters = Array.from({ length: 26 }, (_, index) => (
        bureauLetter(`${100000001 + index}`, '2026-09-20', false)
      ));
      const req = buildRequest('BUREAU', {
        documentSearchBy: 'allLetters',
        page: '2',
        sortBy: 'jurorNumber',
        sortOrder: 'descending',
      }, bureauList(letters));

      controller.getListLetters(app)(req, res);

      const model = renderModel(res);
      const tableHtml = JSON.stringify([model.headings, model.rows]);

      expect(tableHtml).not.to.contain('check-all-jurors');
      expect(tableHtml).to.contain('Pending');
      expect(tableHtml).to.contain('Delete');
      expect(model.paginationObject).to.be.an('object');
    });

    it('hides Select All for a targeted bureau result containing only pending letters', function() {
      const req = buildRequest('BUREAU', {
        documentSearchBy: 'jurorNumber',
        jurorNumber: '100000001',
      }, bureauList([
        bureauLetter('100000001', '2026-09-20', false),
      ]));

      controller.getListLetters(app)(req, res);

      const model = renderModel(res);
      const tableHtml = JSON.stringify([model.headings, model.rows]);

      expect(tableHtml).not.to.contain('check-all-jurors');
      expect(model.totalCheckableJurors).to.equal(0);
      expect(tableHtml).to.contain('Pending');
      expect(tableHtml).to.contain('Delete');
    });

    it('retains bulk and individual selection for eligible bureau letters', function() {
      const req = buildRequest('BUREAU', {
        documentSearchBy: 'jurorNumber',
        jurorNumber: '100000001',
      }, bureauList([
        bureauLetter('100000001', '2026-09-20', true),
        bureauLetter('100000002', '2026-09-20', false),
      ]));

      controller.getListLetters(app)(req, res);

      const model = renderModel(res);
      const tableHtml = JSON.stringify([model.headings, model.rows]);

      expect(tableHtml).to.contain('check-all-jurors');
      expect(tableHtml).to.contain('Select All');
      expect(model.totalCheckableJurors).to.equal(1);
      expect(tableHtml).to.contain('id=\\\"juror-100000001\\\"');
      expect(tableHtml).to.contain('Pending');
      expect(tableHtml).to.contain('Delete');
    });

    it('retains court row rendering without a bureau Select All control', function() {
      const req = buildRequest('COURT', {
        documentSearchBy: 'jurorNumber',
        jurorNumber: '100000001',
      }, {
        headings: ['Juror number', 'Juror name', 'Date printed', 'Row Id'],
        dataTypes: ['number', 'text', 'date', 'hidden'],
        data: [{
          jurorNumber: '100000001',
          jurorName: 'Test Juror',
          datePrinted: '2026-09-20',
          id: 1,
        }],
      });

      controller.getListLetters(app)(req, res);

      const model = renderModel(res);
      const tableHtml = JSON.stringify([model.headings, model.rows]);

      expect(tableHtml).not.to.contain('check-all-jurors');
      expect(tableHtml).to.contain('id=\\\"juror-100000001\\\"');
      expect(tableHtml).to.contain('Test Juror');
      expect(tableHtml).not.to.contain('Delete');
    });
  });

  function buildRequest(userType, query, documentsJurorsList) {
    return {
      params: {
        document: 'initial-summons',
      },
      query,
      session: {
        authentication: {
          userType,
          activeUserType: userType,
        },
        documentsJurorsList,
      },
      url: '/documents/initial-summons/letters-list',
    };
  }

  function bureauList(data) {
    return {
      headings: [
        'Juror number',
        'Juror name',
        'Date printed',
        'hidden_extracted_flag',
        'hidden_form_code',
      ],
      dataTypes: ['number', 'text', 'date', 'hidden', 'hidden'],
      data,
    };
  }

  function bureauLetter(jurorNumber, datePrinted, extracted) {
    return [jurorNumber, 'Test Juror', datePrinted, extracted, '5224'];
  }

  function renderModel(response) {
    expect(response.render).to.have.been.calledOnce;
    expect(response.render.firstCall.args[0]).to.equal('documents/_common/letters-list.njk');

    return response.render.firstCall.args[1];
  }
})();
