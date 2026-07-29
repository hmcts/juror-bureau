const { isIP } = require('node:net');
const { createClient, createCluster } = require('redis');

module.exports.isRedisClusterEnabled = function() {
  return process.env.REDIS_CLUSTER_ENABLED === 'true';
};

module.exports.createRedisClient = function(redisConnectionString) {
  if (!module.exports.isRedisClusterEnabled()) {
    return createClient({
      url: redisConnectionString,
      pingInterval: 5000,
      socket: {
        keepAlive: true,
      },
    });
  }

  const redisUrl = new URL(redisConnectionString);

  return createCluster({
    rootNodes: [{ url: redisConnectionString }],
    defaults: {
      username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
      password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
      pingInterval: 5000,
      socket: {
        keepAlive: true,
        tls: redisUrl.protocol === 'rediss:',
      },
    },
    nodeAddressMap: (address) => {
      const [host, port] = address.split(':');

      return {
        host: isIP(host) ? redisUrl.hostname : host,
        port: Number(port),
      };
    },
  });
};
