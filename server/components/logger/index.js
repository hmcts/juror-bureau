const winston = require('winston');
const customColors = {
  trace: 'white',
  debug: 'green',
  info: 'green',
  warn: 'yellow',
  crit: 'red',
  fatal: 'red',
};
const levels = {
  fatal: 0,
  crit: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

module.exports.Logger = class Logger {
  constructor (config) {
    this.config = config;

    this.transports = [];
    this.origLog = null;
    this.args = null;
  }

  initLogger (app) {
    if (this.config.logConsole) {
      this.transports.push(new (winston.transports.Console)({
        level: this.config.logConsole,
        colorize: true,
        timestamp: true,
      }));
    }

    // Setup the actual logger
    Logger.instance = new (winston.Logger)({
      colors: customColors,
      levels: levels,
      transports: this.transports,
    });

    winston.addColors(customColors);

    if (app) {
      // attach to the app object
      app.logger = Logger.instance;
    }
  }
};
