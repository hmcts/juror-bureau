;(function(){
  'use strict';

  var config = require('../../config/environment')()
<<<<<<< Updated upstream
    , logger
    , spy;

  describe('Logging Component:', function() {

    it('should contain at least one transport', function() {
      logger = require('./')(config);

      expect(Object.keys(logger.transports).length).not.to.equal(0);
=======
    , { Logger } = require('./')
    , spy
    , fs = require('fs');

  describe('Logging Component:', function() {

    beforeEach(function() {
      // fs.cp('./config/environment.template.json', './config/test.json', { overwrite: true }, function() {
      new Logger(config).initLogger();
      // done();
      // });
>>>>>>> Stashed changes
    });

    it('should only contain console transport if config.logConsole is not false', function() {
      var transportsWithConsoleCount
        , transportsWithoutConsoleCount;

      config.logConsole = 'trace';
      logger = require('./')(config);
      transportsWithConsoleCount = Object.keys(logger.transports).length;

      config.logConsole = false;
      logger = require('./')(config);
      transportsWithoutConsoleCount = Object.keys(logger.transports).length;

      expect(transportsWithoutConsoleCount).to.be.equal(transportsWithConsoleCount - 1);
    });

    it('should log a trace entry', function() {
<<<<<<< Updated upstream
      config.logConsole = 'trace';
      spy = sinon.spy(logger, 'trace');
      logger.trace('This is a trace');
=======
      config.logConsole = false;
      spy = sinon.spy(Logger.instance, 'trace');
      Logger.instance.trace('This is a trace');
>>>>>>> Stashed changes
      expect(spy.withArgs('This is a trace').calledOnce).to.equal(true);
    });

    it('should log a debug entry', function() {
<<<<<<< Updated upstream
      config.logConsole = 'trace';
      spy = sinon.spy(logger, 'debug');
      logger.debug('This is a debug');
=======
      config.logConsole = false;
      spy = sinon.spy(Logger.instance, 'debug');
      Logger.instance.debug('This is a debug');
>>>>>>> Stashed changes
      expect(spy.withArgs('This is a debug').calledOnce).to.equal(true);
    });

    it('should log an info entry', function() {
<<<<<<< Updated upstream
      config.logConsole = 'trace';
      spy = sinon.spy(logger, 'info');
      logger.info('This is an info');
=======
      config.logConsole = false;
      spy = sinon.spy(Logger.instance, 'info');
      Logger.instance.info('This is an info');
>>>>>>> Stashed changes
      expect(spy.withArgs('This is an info').calledOnce).to.equal(true);
    });

    it('should log a warn entry', function() {
<<<<<<< Updated upstream
      config.logConsole = 'trace';
      spy = sinon.spy(logger, 'warn');
      logger.warn('This is a warn');
=======
      config.logConsole = false;
      spy = sinon.spy(Logger.instance, 'warn');
      Logger.instance.warn('This is a warn');
>>>>>>> Stashed changes
      expect(spy.withArgs('This is a warn').calledOnce).to.equal(true);
    });

    it('should log a crit entry', function() {
<<<<<<< Updated upstream
      config.logConsole = 'trace';
      spy = sinon.spy(logger, 'crit');
      logger.crit('This is a crit');
=======
      config.logConsole = false;
      spy = sinon.spy(Logger.instance, 'crit');
      Logger.instance.crit('This is a crit');
>>>>>>> Stashed changes
      expect(spy.withArgs('This is a crit').calledOnce).to.equal(true);
    });

    it('should log a fatal entry', function() {
<<<<<<< Updated upstream
      config.logConsole = 'trace';
      spy = sinon.spy(logger, 'fatal');
      logger.fatal('This is a fatal');
=======
      config.logConsole = false;
      spy = sinon.spy(Logger.instance, 'fatal');
      Logger.instance.fatal('This is a fatal');
>>>>>>> Stashed changes
      expect(spy.withArgs('This is a fatal').calledOnce).to.equal(true);
    });

    it('should log a message with an object', function() {
      var latestLogStub = {
        '@message': 'This is a fatal with data',
        '@fields': { hello: 'world' }
      };

      config.logConsole = 'trace';
      logger.fatal('This is a fatal with data', { hello: 'world' });
      expect({
        '@message': logger.transports.jurorLogger.latestLog['message'],
        '@fields': {
          'hello': logger.transports.jurorLogger.latestLog['@fields'].hello,
        }
      }).to.deep.equal(latestLogStub);
    });

  });

})();
