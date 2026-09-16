;(function() {
  'use strict';

  const controller = require('./courts-and-bureau.controller');

  describe('Courts and bureau controller:', function() {
    describe('postFilterCourts', function() {
      let app;
      let res;

      beforeEach(function() {
        app = {
          namedRoutes: {
            build: sinon.stub().returns('/administration/courts-and-bureau/'),
          },
        };
        res = {
          redirect: sinon.stub(),
        };
      });

      it('should redirect to the courts list when the search is empty', async function() {
        const req = { body: { courtSearch: '' } };

        await controller.postFilterCourts(app)(req, res);

        expect(res.redirect).to.have.been.calledWithExactly('/administration/courts-and-bureau/');
      });

      it('should encode the search as a query parameter', async function() {
        const req = { body: { courtSearch: '//malicious.example/?value=test' } };

        await controller.postFilterCourts(app)(req, res);

        expect(res.redirect).to.have.been.calledWithExactly(
          '/administration/courts-and-bureau/?filter=%2F%2Fmalicious.example%2F%3Fvalue%3Dtest',
        );
      });
    });
  });
})();
