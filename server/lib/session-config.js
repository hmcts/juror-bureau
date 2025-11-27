const secretsConfig = require('config');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const expressSession = require('express-session');

module.exports.SessionConfig = class SessionConfig {
  constructor() {
    this._sessionExpires = 10 * (60 * 60);
  }

  start(app) {
    const secret = secretsConfig.get('secrets.juror.bureau-sessionSecret');
    const redisConnectionString = this._getRedisConnectionString();

    const config = this._config(secret);

    if (redisConnectionString) {
      this.redisClient();
      config.store = this.redisStore();
    }

    app.use(expressSession(config));
  }

  redisClient() {
    this._redisClient = createClient({
      url: secretsConfig.get('secrets.juror.bureau-redisConnection'),
      pingInterval: 5000,
      socket: {
        keepAlive: true,
      },
    });

    this._redisClient.connect()
      .catch(function(error) {
        console.log('Error connecting redis client: ', error);
      });

    this._redisClient.on('error', function(err) {
      console.log(new Date().toLocaleString() + ' - ' + 'Could not connect to redis ' + err);
    });
    this._redisClient.on('connect', function() {
      console.log(new Date().toLocaleString() + ' - ' + 'Connected to redis successfully');
    });
  }

  redisStore() {
    return new RedisStore({
      client: this._redisClient,
      prefix: 'JurorBureau:',
    });
  }

  _getRedisConnectionString() {
    let redisConnectionString;

    try {
      redisConnectionString = secretsConfig.get('secrets.juror.bureau-redisConnection');
      return redisConnectionString;
    } catch (err) {
      console.log('Redis connection string is not available... setting in memory sessions');
      return;
    }
  }

  _config(secret) {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      secret,
      resave: false,
      saveUninitialized: false,
      maxAge: this._sessionExpires,
      name: 'juror_bureau_session',
      cookie: {
        secure: isProduction,
        sameSite: 'lax', // oauth redirect does not work with strict
        httpOnly: true,
      },
    };
  };
};
