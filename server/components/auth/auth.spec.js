;(function(){
  'use strict';

  var auth = require('./');


  describe('Authentication Component:', function() {

    it('should create new JWT token', function() {
      var reqStub = {
          session: {},
        }
        , bodyStub = {
          hello: 'world',
        }

        , token = auth.createJWTToken(reqStub, bodyStub, '[super-secret-key][super-secret-key][super-secret-key]');

      expect(typeof token).to.equal('string');
    });

    it('should decode existing JWT token', function() {
      // eslint-disable-next-line
      var tokenStub = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkIiwiaWF0IjoxNDg0NzM4MzAwLCJleHAiOjQ2MDY4MDIzMDB9.eVamJ84oF7ytRNCWhp1ekdqg6VnInnsQZEY2DQfCEAk'
        , reqStub = {
          session: {
            authToken: tokenStub,
          },
        }

        , decoded = auth.getToken(reqStub);

      expect(decoded.hello).to.equal('world');
    });
  });

})();
