;(function() {
  'use strict';

  const controller = require('./letters-list.controller');

  describe('Letters list controller', function() {
    const headings = [
      'Juror number',
      'Date printed',
      'hidden_extracted_flag',
      'hidden_form_code',
    ];
    const dataTypes = ['number', 'date', 'hidden', 'hidden'];

    function renderList(userType, documentSearchBy, data) {
      const app = {
        namedRoutes: {
          build: sinon.stub().callsFake((route) => `/${route}`),
        },
        logger: {
          crit: sinon.stub(),
        },
      };
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
            checkedJurors: [],
          },
        },
        url: '/documents/initial-summons/list',
      };
      const res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
      };

      controller.getListLetters(app)(req, res);

      expect(app.logger.crit).not.to.have.been.called;
      expect(res.render).to.have.been.calledOnce;

      return res.render.firstCall.args[1];
    }

    it('does not show Select all for queued bureau letters and keeps pending row content aligned', function() {
      const view = renderList('BUREAU', 'allLetters', [
        ['123456789', '2026-09-08', false, '5220'],
      ]);

      expect(view.headings[0].id).to.equal('check-all-juror');
      expect(view.headings[0].html).to.equal('');
      expect(view.rows[0][0]).to.deep.equal({});
      expect(view.rows[0][2].html).to.include('Pending');
      expect(view.rows[0][2].html).to.include('Delete');
    });

    it('does not show Select all for pending-only bureau results', function() {
      const view = renderList('BUREAU', 'jurorNumber', [
        ['123456789', '2026-09-08', false, '5220'],
      ]);

      expect(view.totalCheckableJurors).to.equal(0);
      expect(view.headings[0].html).to.equal('');
      expect(view.rows[0][0]).to.deep.equal({});
    });

    it('retains Select all and individual checkboxes for selectable bureau results', function() {
      const view = renderList('BUREAU', 'jurorNumber', [
        ['123456789', '2026-09-08', true, '5220'],
      ]);

      expect(view.totalCheckableJurors).to.equal(1);
      expect(view.headings[0].html).to.include('id="check-all-jurors"');
      expect(view.headings[0].html).to.include('Select All');
      expect(view.rows[0][0].html).to.include('id="juror-123456789"');
    });

    it('does not add Select all to court results', function() {
      const view = renderList('COURT', 'jurorNumber', [
        ['123456789', '2026-09-08', true, '5220'],
      ]);

      expect(view.headings[0].html).to.equal('');
      expect(view.rows[0][0].html).to.include('id="juror-123456789"');
    });
  });
})();
