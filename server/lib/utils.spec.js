;(function(){
  'use strict';

  var utils = require('./utils')
    , fse = require('fs-extra')
    , { Logger } = require('../components/logger');

  describe('Utility Component:', function() {

    it('should force https by redirecting when not on https', function() {
      var reqStub = {
          headers: {'x-forwarded-proto': 'http'},
          get: function(key) {
            var options = {
              'Host': 'localhost:3000'
            };

            if (options.hasOwnProperty(key)) {
              return options[key];
            }
            return;
          },
          url: '/'
        }
        , resStub = {
          redirect: function(status, host) {
            return {
              status: status,
              host: host
            };
          }
        }
        , cb = function() {
          // Empty Callback
        }
        , result = utils.forceHttps(reqStub, resStub, cb);

      expect(result.status).toEqual(302);
      expect(result.host).toEqual('https://localhost:3000/');
    });

    it('should not redirect if already on https', function() {
      var reqStub = {
          headers: {'x-forwarded-proto': 'https'}
        }
        , resStub = {}
        , cb = function() {
          // Empty Callback
          return true;
        }
        , result = utils.forceHttps(reqStub, resStub, cb);

      expect(result).toEqual(true);
    });


    it('should reject request due to authorisation if username and password are not set for basicAuth', function() {
      var username
        , password
        , basicAuthStub = function() {}
        , basicAuth = utils.basicAuth(Logger.instance, username, password, basicAuthStub)
        , reqStub = {}
        , resStub = {
          statusValue: '',
          renderPath: '',
          status: function(status) {
            this.statusValue = status;
            return this;
          },
          render: function(view) {
            this.renderPath = view;
            return this;
          }
        }
        , cb = function() {}

        , result = basicAuth(reqStub, resStub, cb);

      expect(result.statusValue).toEqual(401);
    });

    // eslint-disable-next-line max-len
    it('should reject request if username and password provided do not match defined values for basicAuth', function() {
      var username = 'admin'
        , password = 'password'
        , basicAuthStub = function(req) {
          return {
            name: req.name,
            pass: req.pass
          };
        }
        , basicAuth = utils.basicAuth(Logger.instance, username, password, basicAuthStub)
        , reqStub = {
          name: 'bob',
          pass: 'test'
        }
        , resStub = {
          values: {
            'status': '',
            'WWW-Authenticate': ''
          },
          set: function(key, value) {
            this.values[key] = value;
            return this;
          },
          sendStatus: function(status) {
            this.values.status = status;
            return this;
          }
        }
        , cb = function() {

        }


        , result = basicAuth(reqStub, resStub, cb);

      expect(result.values['WWW-Authenticate']).toEqual('Basic realm=Authorization Required');
      expect(result.values['status']).toEqual(401);
    });

    // eslint-disable-next-line max-len
    it('should continue normal execution if basicAuth passes', function() {
      var username = 'admin'
        , password = 'password'
        , basicAuthStub = function(req) {
          return {
            name: req.name,
            pass: req.pass
          };
        }
        , basicAuth = utils.basicAuth(Logger.instance, username, password, basicAuthStub)
        , reqStub = {
          name: 'admin',
          pass: 'password'
        }
        , resStub = {}
        , cb = function() {
          return true;
        }

        , result = basicAuth(reqStub, resStub, cb);

      expect(result).toEqual(true);
    });





    it('should sort response list by ascending date', function() {
      var respData = [{
          'id': '1',
          'receivedAt': '2016-08-18 12:00:00'
        }, {
          'id': '2',
          'receivedAt': '2016-08-17 14:00:00'
        }, {
          'id': '3',
          'receivedAt': '2016-08-24 14:00:00'
        }]
        , expectedSortResp = [{
          'id': '2',
          'receivedAt': '2016-08-17 14:00:00'
        }, {
          'id': '1',
          'receivedAt': '2016-08-18 12:00:00'
        }, {
          'id': '3',
          'receivedAt': '2016-08-24 14:00:00'
        }]
        , tmpSortedResp = utils.sortResponseData(respData, 'receivedAt');

      // Compare first element in each array to ensure they are equal
      expect(expectedSortResp[0].id).toEqual(tmpSortedResp[0].id);
    });

    it('should sort response list by descending date', function() {
      var respData = [{
          'id': '1',
          'receivedAt': '2016-08-18 12:00:00'
        }, {
          'id': '2',
          'receivedAt': '2016-08-17 14:00:00'
        }, {
          'id': '3',
          'receivedAt': '2016-08-24 14:00:00'
        }]
        , expectedSortResp = [{
          'id': '3',
          'receivedAt': '2016-08-24 14:00:00'
        }, {
          'id': '1',
          'receivedAt': '2016-08-18 12:00:00'
        }, {
          'id': '2',
          'receivedAt': '2016-08-17 14:00:00'
        }]
        , tmpSortedResp = utils.sortResponseData(respData, 'receivedAt', true);

      // Compare first element in each array to ensure they are equal
      expect(expectedSortResp[0].id).toEqual(tmpSortedResp[0].id);
    });

    it('should keep urgent replies at top of list', function() {
      var respData = [{
          'id': '1',
          'receivedAt': '2016-08-18 12:00:00',
          'urgent': false
        }, {
          'id': '2',
          'receivedAt': '2016-08-17 14:00:00',
          'urgent': false
        }, {
          'id': '3',
          'receivedAt': '2016-08-23 11:00:00',
          'urgent': true
        }, {
          'id': '4',
          'receivedAt': '2016-08-24 14:00:00',
          'urgent': false
        }]
        , expectedSortResp = [{
          'id': '3',
          'receivedAt': '2016-08-23 11:00:00',
          'urgent': true
        }, {
          'id': '2',
          'receivedAt': '2016-08-17 14:00:00',
          'urgent': false
        }, {
          'id': '1',
          'receivedAt': '2016-08-18 12:00:00',
          'urgent': false
        }, {
          'id': '4',
          'receivedAt': '2016-08-24 14:00:00',
          'urgent': false
        }]
        , tmpSortedResp = utils.sortResponseData(respData, 'receivedAt', 'urgent');

      // Compare first element in each array to ensure they are equal
      expect(expectedSortResp[0].id).toEqual(tmpSortedResp[0].id);
    });

    it('should create directory if not already present', function() {

      var checkDir = 'tmpTestDir/'
        , result
        , verify;

      // Prepare by ensuring directory doesn't exist
      fse.removeSync(checkDir);

      // Perform check/create
      result = utils.checkDirectoryCreate(checkDir);

      // Directory should exist
      try {
        fse.accessSync(checkDir, fse.F_OK);
        verify = true;
        // Do something
      } catch (e) {
        // It isn't accessible
        verify = false;
      }

      // Verify
      expect(result).toEqual(true);
      expect(verify).toEqual(true);
    });

    it('should not create directory if permissions check fails', function() {

      var checkDir = '/tmpTestDir/'
        , result
        , verify;

      // Prepare by ensuring directory doesn't exist
      fse.removeSync(checkDir);

      // Perform check/create
      result = utils.checkDirectoryCreate(checkDir);

      // Directory should exist
      try {
        fse.accessSync(checkDir, fse.F_OK);
        verify = true;
        // Do something
      } catch (e) {
        // It isn't accessible
        verify = false;
      }

      // Verify
      expect(result).toEqual(false);
      expect(verify).toEqual(false);
    });

    it('should transform object to expected format', function() {

      var bodyStub = {
          data: {
            key: 'value'
          }
        }
        , transformedBodyWithData = utils.basicDataTransform(bodyStub)
        , transformedBodyWithoutData = utils.basicDataTransform(bodyStub.data);

      expect(transformedBodyWithData).toEqual(bodyStub.data);
      expect(transformedBodyWithoutData).toEqual(bodyStub.data);
    });

  });


})();
