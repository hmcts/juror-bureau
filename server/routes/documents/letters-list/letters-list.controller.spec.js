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

    function pendingLetter(jurorNumber) {
      return [jurorNumber, 'Pending juror', '2026-09-01', false, '5220'];
    }

    function printedLetter(jurorNumber) {
      return [jurorNumber, 'Printed juror', '2026-08-01', true, '5220'];
    }

    function buildRequest(userType, data, documentSearchBy) {
      return {
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
            checkedJurors: [],
          },
        },
        url: `/documents/initial-summons?documentSearchBy=${documentSearchBy}`,
      };
    }

    function renderList(userType, data, documentSearchBy) {
      const app = {
        namedRoutes: {
          build: sinon.stub().returns('/documents'),
        },
        logger: {
          crit: sinon.stub(),
        },
      };
      const req = buildRequest(userType, data, documentSearchBy);
      const res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
      };

      controller.getListLetters(app)(req, res);

      expect(res.render).to.have.been.calledOnce;
      return res.render.firstCall.args[1];
    }

    it('hides Select All for queued bureau letters and keeps pending rows aligned', function() {
      const viewModel = renderList('BUREAU', [pendingLetter('111111111')], 'allLetters');

      expect(viewModel.headings[0].html).to.equal('');
      expect(viewModel.headings).to.have.length(4);
      expect(viewModel.rows[0]).to.have.length(4);
      expect(viewModel.rows[0][0]).to.deep.equal({});
      expect(viewModel.rows[0][3].html).to.include('Pending');
      expect(viewModel.rows[0][3].html).to.include('Delete');
    });

    it('hides Select All when a bureau search has no checkable letters', function() {
      const viewModel = renderList('BUREAU', [pendingLetter('222222222')], 'jurorNumber');

      expect(viewModel.headings[0].html).to.equal('');
      expect(viewModel.totalCheckableJurors).to.equal(0);
    });

    it('shows Select All and individual selection for checkable bureau results', function() {
      const viewModel = renderList(
        'BUREAU',
        [pendingLetter('333333333'), printedLetter('444444444')],
        'jurorNumber',
      );

      expect(viewModel.headings[0].html).to.include('id="check-all-jurors"');
      expect(viewModel.rows[0][0]).to.deep.equal({});
      expect(viewModel.rows[1][0].html).to.include('name="checked-jurors"');
      expect(viewModel.totalCheckableJurors).to.equal(1);
    });

    it('keeps court letter selection behaviour unchanged', function() {
      const viewModel = renderList('COURT', [printedLetter('555555555')], 'jurorNumber');

      expect(viewModel.headings[0].html).to.equal('');
      expect(viewModel.rows[0][0].html).to.include('name="checked-jurors"');
      expect(viewModel.headings).to.have.length(4);
      expect(viewModel.rows[0]).to.have.length(4);
    });
  });
})();
