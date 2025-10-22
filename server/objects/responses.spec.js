;(function(){
  'use strict';

  var responses = require('./responses')
    , urljoin = require('url-join').default;

  describe('Responses API Object:', function() {

    it('should return false if get all is attempted without data tag', function() {
      var hasModAccess = false
        , bodyStub = { key: 'value' }
        , httpRespStub = {
          request: {
            uri: {
              query: 'filterBy=todo',
            }
          }
        }
        , transformedBody = responses.getAllTransform(hasModAccess)(bodyStub, httpRespStub);

      expect(transformedBody).to.equal(false);
    });

    it('should return object with two keys if get all succeeds', function() {
      var hasModAccess = false
        , bodyStub = {
          data: [{
            jurorNumber: '586856851',
            title: 'Hon',
            firstName: 'Den',
            lastName: 'Rob',
            courtName: 'NOTTINGHAM',
            processingStatus: 'TODO',
            poolNumber: '222',
            urgent: true,
            superUrgent: true,
            slaOverdue: true,
            receivedAt: 1484562455000
          }],
          todoCount: 1,
          repliesPendingCount: 3,
          completedCount: 1
        }
        , httpRespStub = {
          request: {
            uri: {
              query: 'filterBy=todo',
            }
          }
        }
        , transformedBody = responses.getAllTransform(hasModAccess)(bodyStub, httpRespStub);

      expect(transformedBody.hasOwnProperty('items')).to.equal(true);
      expect(transformedBody.items.length).to.equal(1);

      expect(transformedBody.hasOwnProperty('counts')).to.equal(true);
      expect(transformedBody.counts.todo).to.equal(1);
      expect(transformedBody.counts.pending).to.equal(3);
      expect(transformedBody.counts.completed).to.equal(1);
    });

    it('should call correct URL for get all', function() {
      var rpStub = function(options) {
          return options;
        }
        , appStub = {
          logger: {
            info: function() {
              return;
            }
          }
        }
        , response = responses.object.query(rpStub, appStub, 'test-token', 'todo')
        , requestUri = urljoin(process.env.API_ENDPOINT || 'http://localhost:8080/api/v1', 'bureau/responses') + '/todo';

      expect(response.uri).to.equal(requestUri);
    });
  });

})();
