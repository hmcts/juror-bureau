const secretsConfig = require('config');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const expressSession = require('express-session');

module.exports.SessionConfig = class SessionConfig {
  constructor() {
    this._sessionExpires = 10 * (60 * 60);
  }

  start(app) {
    const secret = secretsConfig.get('secrets.juror-digital-vault.bureau-sessionSecret');
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
      url: secretsConfig.get('secrets.juror-digital-vault.redis-connection-string'),
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
      prefix: 'JurorMod:',
    });
  }

  _getRedisConnectionString() {
    let redisConnectionString;

    try {
      redisConnectionString = secretsConfig.get('secrets.juror-digital-vault.redis-connection-string');
      return redisConnectionString;
    } catch (err) {
      console.log('Redis connection string is not available... setting in memory sessions');
      return;
    }
  }

  _config(secret) {
    return {
      secret,
      resave: false,
      saveUninitialized: false,
      maxAge: this._sessionExpires,
      name : 'sessionId',
      cookie: {
        httpOnly: true,
      },
    };
  };
};
