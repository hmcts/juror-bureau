(function() {
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

    it('does not show Select All for Bureau letters queued for printing', function() {
      const pendingLetter = letter('111111111', '2026-07-10', false, '1001');
      const model = renderList({
        userType: 'BUREAU',
        query: { documentSearchBy: 'allLetters' },
        data: [pendingLetter],
      });

      expect(model.headings[0].html).to.equal('');
      expect(model.rows[0][0]).to.deep.equal({});
      expect(model.rows[0][2].html).to.contain('Pending');
      expect(model.rows[0][2].html).to.contain('Delete');
      expect(JSON.stringify(model)).not.to.contain('Select All');
    });

    it('does not show Select All for a sorted second page of queued Bureau letters', function() {
      const data = Array.from({ length: 26 }, (_, index) => (
        letter(`${100000000 + index}`, '2026-07-10', false, `${index}`)
      ));
      const model = renderList({
        userType: 'BUREAU',
        query: {
          documentSearchBy: 'allLetters',
          page: '2',
          sortBy: 'jurorNumber',
          sortOrder: 'ascending',
        },
        data,
      });

      expect(model.headings[0].html).to.equal('');
      expect(model.rows).to.have.length(1);
      expect(model.rows[0][0]).to.deep.equal({});
      expect(model.rows[0][2].html).to.contain('Pending');
    });

    it('does not show Select All for pending-only targeted Bureau results', function() {
      const model = renderList({
        userType: 'BUREAU',
        query: { documentSearchBy: 'jurorNumber', jurorNumber: '111111111' },
        data: [letter('111111111', '2026-07-10', false, '1001')],
      });

      expect(model.totalCheckableJurors).to.equal(0);
      expect(model.headings[0].html).to.equal('');
      expect(model.rows[0][0]).to.deep.equal({});
    });

    it('retains bulk and individual selection for mixed Bureau results', function() {
      const model = renderList({
        userType: 'BUREAU',
        query: { documentSearchBy: 'jurorName', jurorName: 'Smith' },
        data: [
          letter('111111111', '2026-07-10', false, '1001'),
          letter('222222222', null, false, '1002'),
        ],
      });

      expect(model.totalCheckableJurors).to.equal(1);
      expect(model.headings[0].html).to.contain('Select All');
      expect(model.rows[0][0]).to.deep.equal({});
      expect(model.rows[1][0].html).to.contain('name="checked-jurors"');
    });

    it('keeps Court row selection without showing Select All', function() {
      const model = renderList({
        userType: 'COURT',
        query: { documentSearchBy: 'jurorNumber', jurorNumber: '111111111' },
        data: [letter('111111111', null, false, '1001')],
      });

      expect(model.headings[0].html).to.equal('');
      expect(model.rows[0][0].html).to.contain('name="checked-jurors"');
      expect(JSON.stringify(model)).not.to.contain('Select All');
    });

    function renderList({ userType, query, data }) {
      const req = {
        params: { document: 'confirmation' },
        query: { ...query },
        url: '/documents/confirmation/letters-list',
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
      };
      const res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
      };

      controller.getListLetters(app)(req, res);

      expect(res.render).to.have.been.calledOnce;
      expect(res.render.firstCall.args[0]).to.equal('documents/_common/letters-list.njk');

      return res.render.firstCall.args[1];
    }

    function letter(jurorNumber, datePrinted, extracted, formCode) {
      return [jurorNumber, datePrinted, extracted, formCode];
    }
  });
})();
