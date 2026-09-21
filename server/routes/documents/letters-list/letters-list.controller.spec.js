;(function() {
  'use strict';

  const { getListLetters } = require('./letters-list.controller');

  describe('Letters list controller:', function() {
    function buildApp() {
      return {
        namedRoutes: {
          build(name) {
            return `/${name}`;
          },
        },
        logger: {
          crit: sinon.stub(),
        },
      };
    }

    function buildResponse() {
      return {
        render: sinon.stub(),
        redirect: sinon.stub(),
      };
    }

    function buildRequest(data, documentSearchBy, userType = 'BUREAU', query = {}) {
      return {
        params: {
          document: 'initial-summons',
        },
        query: {
          documentSearchBy,
          ...query,
        },
        session: {
          authentication: {
            userType: [userType],
            activeUserType: userType,
          },
          documentsJurorsList: {
            headings: [
              'Juror number',
              'Name',
              'Date printed',
              'hidden_extracted_flag',
              'hidden_form_code',
            ],
            dataTypes: ['number', 'text', 'date', 'hidden', 'hidden'],
            data,
          },
        },
        url: '/documents/initial-summons/list',
      };
    }

    function pendingLetter(jurorNumber) {
      return [jurorNumber, `Juror ${jurorNumber}`, '2026-07-10', false, '5224'];
    }

    function selectableLetter(jurorNumber) {
      return [jurorNumber, `Juror ${jurorNumber}`, null, false, '5224'];
    }

    function renderList(req) {
      const res = buildResponse();

      getListLetters(buildApp())(req, res);

      expect(res.render).to.have.been.calledOnce;
      return res.render.firstCall.args[1];
    }

    it('hides Select all on a sorted later page of the Bureau queued-letter list', function() {
      const queuedLetters = Array.from({ length: 26 }, (_, index) => pendingLetter(`${100000000 + index}`));
      const req = buildRequest(queuedLetters, 'allLetters', 'BUREAU', {
        page: '2',
        sortBy: 'jurorNumber',
        sortOrder: 'descending',
      });
      const context = renderList(req);

      expect(context.headings[0].html).to.equal('');
      expect(context.rows).not.to.contain('check-all-jurors');
      expect(context.rows).not.to.contain('Select All');
      expect(context.rows).to.contain('Pending');
      expect(context.rows).to.contain('Delete');
      expect(context.rows).not.to.contain('name="checked-jurors"');
    });

    it('hides Select all when a targeted Bureau search contains only pending letters', function() {
      const context = renderList(buildRequest([pendingLetter('100000001')], 'jurorNumber'));

      expect(context.totalCheckableJurors).to.equal(0);
      expect(context.headings[0].html).to.equal('');
      expect(context.rows).not.to.contain('name="checked-jurors"');
    });

    it('keeps bulk and individual selection for eligible letters in a mixed Bureau search', function() {
      const context = renderList(buildRequest([
        pendingLetter('100000001'),
        selectableLetter('100000002'),
      ], 'jurorName'));

      expect(context.totalCheckableJurors).to.equal(1);
      expect(context.headings[0].html).to.contain('id="check-all-jurors"');
      expect(context.headings[0].html).to.contain('Select All');
      expect(context.rows.match(/name="checked-jurors"/g)).to.have.length(1);
      expect(context.rows).to.contain('Pending');
      expect(context.rows).to.contain('Delete');
    });

    it('keeps the blank selection header and individual selection for Court results', function() {
      const context = renderList(buildRequest([
        selectableLetter('100000001'),
      ], 'jurorNumber', 'COURT'));

      expect(context.headings[0].html).to.equal('');
      expect(context.rows).to.contain('name="checked-jurors"');
      expect(context.rows).not.to.contain('check-all-jurors');
    });
  });
})();
