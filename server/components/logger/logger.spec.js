;(function(){
  'use strict';

  var config = require('../../config/environment')()
    , { Logger } = require('./');

  describe('Logging Component:', function() {

    beforeEach(function() {
      new Logger(config).initLogger();
    });

    it('should only contain console transport if config.logConsole is not false', function() {
      var transportsWithConsoleCount
        , transportsWithoutConsoleCount;

      config.logConsole = 'trace';
      transportsWithConsoleCount = Object.keys(Logger.instance.transports).length;

      // reset the logger for the next check
      Logger.instance = null;
      config.logConsole = false;
      new Logger(config).initLogger();
      transportsWithoutConsoleCount = Object.keys(Logger.instance.transports).length;

      expect(transportsWithoutConsoleCount).toBe(transportsWithConsoleCount - 1);
    });

    it('should log a trace entry', function() {
      config.logConsole = false;
      const spy = jest.spyOn(Logger.instance, 'trace');

      Logger.instance.trace('This is a trace');
      expect(spy).toHaveBeenCalledWith('This is a trace');
    });

    it('should log a debug entry', function() {
      config.logConsole = false;
      const spy = jest.spyOn(Logger.instance, 'debug');

      Logger.instance.debug('This is a debug');
      expect(spy).toHaveBeenCalledWith('This is a debug');
    });

    it('should log an info entry', function() {
      config.logConsole = false;
      const spy = jest.spyOn(Logger.instance, 'info');

      Logger.instance.info('This is an info');
      expect(spy).toHaveBeenCalledWith('This is an info');
    });

    it('should log a warn entry', function() {
      config.logConsole = false;
      const spy = jest.spyOn(Logger.instance, 'warn');

      Logger.instance.warn('This is a warn');
      expect(spy).toHaveBeenCalledWith('This is a warn');
    });

    it('should log a crit entry', function() {
      config.logConsole = false;
      const spy = jest.spyOn(Logger.instance, 'crit');

      Logger.instance.crit('This is a crit');
      expect(spy).toHaveBeenCalledWith('This is a crit');
    });

    it('should log a fatal entry', function() {
      config.logConsole = false;
      const spy = jest.spyOn(Logger.instance, 'fatal');

      Logger.instance.fatal('This is a fatal');
      expect(spy).toHaveBeenCalledWith('This is a fatal');
    });

  });

})();
