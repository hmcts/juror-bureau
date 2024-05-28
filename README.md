# Juror Bureau Portal

- Author: MoJ Team
- Technologies: NodeJS, Express, Nunjucks
- Summary: A frontend application for serving the Juror Bureau Portal application.
- Target Product: Juror Bureau Portal Frontend

## Development Environment

### Installation
We require NodeJS (>=18) and Yarn (corepack is included in recent node).

We recommend using `nvm` to manage your node versions locally, but if you prefer to manage them any other way feel free.

#### Using nvm and yarn

[Use nvm's Github to install](https://github.com/nvm-sh/nvm) if you dont have it already.

```sh
nvm install 20 # install node version 20
nvm use 20 # set the current shell to use version 20 of node
nvm alias default 20 # set the node version 20 to be the default version
```

After setting node 20 to be the version of node to use, we need to enable yarn

```sh
corepack enable yarn
```

The version of yarn is set by the project's `.yarnrc.yml` file so do not worry about the version now.

#### Running the application

In a terminal window (could also be vscode's embedded terminal) point to the project directory and run:

```sh
yarn -v # should run yarn >=3
yarn install

# for development
yarn dev # runs a static version
yarn dev:watch # runs with nodemon, any changes will trigger a restart

# for production
yarn serve
```

After running all the above, you should see the application running. If you get any errors about the environemnt files missing, read below.

#### Configurations

We provide a `/config` in the root of the project that contains a template file. For local development, copy the file and rename it `development.json`. If you need help finding any of the development keys, get in touch with DevOps.

### Redis

To run redis, the developer can run however they want locally, we recommend docker.

To run with docker, we provide a simple docker-compose file to start a redis container.
Simply point to `/redis` and then:

```sh
docker compose up -d # this will run a redis database locally
```


The command above assumes the developer has docker installed, so if you do not have docker check the redis website below.

[Install redis on MacOS](https://redis.io/docs/install/install-redis/install-redis-on-mac-os/)

