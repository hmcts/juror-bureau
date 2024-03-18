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
yarn -v # should log 3.8.1
yarn install
yarn start
```

After running all the above, you should see the application running (or some errors for missing keys). If you get the errors, contact DevOps or other Senior Devs to help you with those keys.

### Redis

To run redis, the developer can run however they want locally, we recommend docker.

To run with docker, we provide a simple docker-compose file to start a redis container.
Simply point to `/redis` and then:

```sh
docker compose up -d # this will run a redis database locally
```

The command above assumes the developer has docker installed, so if you do not have docker check the redis website below.

[Install redis on MacOS](https://redis.io/docs/install/install-redis/install-redis-on-mac-os/)

<!-- #### Global Packages
Once Node and NPM are working you must install the following packages globally using;

```bash
npm install -g grunt-cli
```

[Refer to this document if you get a permission issue](https://docs.npmjs.com/getting-started/fixing-npm-permissions)

#### Local Packages
Install the main packages locally from `package.json` using the commands;
```bash
npm install
```


#### Environment Variable
##### <a name="environment_secrets"></a>Secrets
In order for certain parts of the system to work a configuration secrets file must be created, this is ignored by git
to prevent these values from entering source control. The file must be located at `server/config/environment/secret.js` and there is a template called `secret.template.js` in the same directory which can be used for reference.

##### System
As well as the secret values above, certain configuration values can be overwridden when starting the server. These can be environment variables within the system or as commands prior to the node start script. For example `PORT=4000 node server/index.js`. The available options are detailed here;

| Variable      | Accepted values                 | Default value                   | Description                                                 |
| ------------- | ------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| NODE_ENV      | development / production / test |                                 | What environment we are building                            |
| PORT          | {integer}                       | 3000                            | The TCP port the server will bind to                        |
| IP            | {string}                        | '0.0.0.0'                       | The IP address the server will bind to                      |
| API_ENDPOINT  | {string}                        | 'http://localhost:8080/api/v1/' | The full Url to the back-end, including the version prefix  |
| TRACKING_CODE | {string}                        |                                 | The code for analytics tracking                             |


### Development server
The development environment has been configured to make use of [Browsersync](https://www.browsersync.io) and [livereload](https://github.com/gruntjs/grunt-contrib-watch#optionslivereload). This means that any time you make code changes to the Node / Express backend the server will reload itself, if you make changes to the front-end then the browser should refresh itself without having to restart the server.

To run the environment during development you can run the command below;

```bash
grunt serve
```


### Code Quality / Linting
#### SCSS Lint
We're using scss-lint via a grunt task. This requires that you have [ruby installed](https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-ubuntu-14-04) on your machine as well as the [scss-lint gem](https://github.com/brigade/scss-lint#installation). We're mostly using the default config: any custom rules are set in the `.scss-lint.yml` file at the root of the project. To run manually use the command

```bash
grunt scsslint
```

Plugins are available for code editors, allowing you to lint the file as you write it:

* Sublime - [SublimeLinter-contrib-scss-lint](https://packagecontrol.io/packages/SublimeLinter-contrib-scss-lint).
* Atom - [linter-scss-lint](https://atom.io/packages/linter-scss-lint)
* VSCode - [scss-lint](https://marketplace.visualstudio.com/items?itemName=adamwalzer.scss-lint)


#### ESLint
For javascript we're using [ES Lint](http://eslint.org/) via a grunt task. Non-default rules are specified in the `.eslintrc` file at the root of the project and files / patterns to be ignored are listed in the `.eslintignore` file in the same location. To run manually use the command

```bash
grunt eslint
```

Again, plugins are available for code editors:

* Sublime - [SublimeLinter-contrib-eslint](https://packagecontrol.io/packages/SublimeLinter-contrib-eslint)
* Atom - [linter-eslint](https://github.com/AtomLinter/linter-eslint)
* VSCode - [vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)


#### SonarQube
The ODSC has a standard set of rules for Javascript and checking code against SonarQube is part of the security requirements of the project, as some of the code checks performed match against common security vulnerabilities. There is a `sonar-[branch].properties` file at the root of the project to configure some parts of the SonarQube process. The SonarQube scan should be done automatically as part of the Jenkins build.




### Testing
There are several aspects to testing which can be run using Grunt. At a basic level tests can be run run using the below commands.
```bash
grunt test:unit
grunt test:integration
grunt test:coverage
npm run test:e2e
```

#### Installation
You must complete the below steps before you can run the E2E tests, as they require a node oracle driver. Note that it is important that you get the **12.1** client version.

Detailed instructions can be found here: [http://www.oracle.com/technetwork/topics/linuxx86-64soft-092277.html#ic_x64_inst](http://www.oracle.com/technetwork/topics/linuxx86-64soft-092277.html#ic_x64_inst)

```bash
sudo mv instantclient-basic-linux.x64-12.1.0.2.0.zip /opt/oracle
sudo mv instantclient-sdk-linux.x64-12.1.0.2.0.zip /opt/oracle
cd /opt/oracle
sudo unzip instantclient-basic-linux
sudo unzip instantclient-sdk-linux
cd /opt/oracle/instantclient_12_1
sudo ln -s libclntsh.so.12.1 libclntsh.so
sudo ln -s libocci.so.12.1 libocci.so
export LD_LIBRARY_PATH=/opt/oracle/instantclient_12_1:$LD_LIBRARY_PATH
export OCI_LIB_DIR=/opt/oracle/instantclient_12_1/
export OCI_INC_DIR=/opt/oracle/instantclient_12_1/sdk/include/
sudo apt-get install libaio1
```

#### Unit
Unit tests can be written by placing a `*.spec.js` file along-side the file which needs tested. These will build the front-end server as needed.

#### Integration
Integration tests can be written by placing a `*.integration.js` file along-side the file which needs tested. These will build and run the front-end server as needed.

#### End-to-end
End-to-end tests can be written by creating Cucumber feature files inside `tests/e2e/features`. These will require that the front-end server be running.

#### Coverage
Coverage reports can also be generated and will create HTML reports with a `coverage` folder, as well as checking against defined thresholds in regards to failure or not.




## Build Environment (WIP)
A possible process to run on a build server is as follows:
```
npm install -g grunt-cli --silent
npm install --silent
npm test
grunt mocha_istanbul
grunt code-lint
grunt accessibility-check
NODE_ENV=production grunt build:dist
```

Note that this assumes there is already a mock server running with a command such as:
```
grunt:mock
```




## Live Environment
To build for production environment run the following command which will create a folder called `dist` which can be
treated as an artifact to be deployed. Please also ensure you have created the secret file as described in [Secrets section](#environment_secrets).
```
grunt build:dist
```

This command will not run tests, as it is assumed that running the distribution build process will be triggered after tests have passed, coverage thresholds are maintained and linters and SonarQube checks have been made.

 -->
