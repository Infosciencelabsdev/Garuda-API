// Libraries
import * as Hapi from 'hapi';
import { IPlugin } from '../plugins/interfaces';
import { IServerConfigurations, Web3Configuration } from '../configurations/index';
import * as User from '../user/index';
import { IDatabase } from '../database/database';
import { LoggerInstance } from 'winston';
import * as Boom from 'boom';

// Application Modules
import * as admin from "../admin";
import * as Wallet from "../wallet";
import * as explorer from '../explorer';
import * as Organization from '../organization';
import * as file from '../files';
import * as assets from '../assets';
import * as marketplace from '../marketplace';
import * as search from '../search';
import * as web3 from '../web3';
import * as gov from '../gov';
import * as transfer from '../transfer';
import * as socket from '../socket';
import * as transaction from '../transaction';
import * as document from '../docs';
import * as sawtooth from '../saw-client';
import * as certificate from '../certificates';
export async function init(
  configs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance,
  web3Config: Web3Configuration): Promise<Hapi.Server> {
  try {

    const port = process.env.PORT || configs.port;

    const server = new Hapi.Server({
      port: port,
      routes: {
        cors: {
          origin: ['*'],
          additionalHeaders: ['cache-control', 'X-XSRF-TOKEN', 'DNT', 'User-Agent', 'X-Requested-With', 'If-Modified-Since', 'Cache-Control', 'Content-Type', 'Range', 'X-Forwarded-Path']
        },
        validate: {
          failAction: async (request: Hapi.Request, h: Hapi.ResponseToolkit, err?: Error) => {
            if (process.env.NODE_ENV === 'prod') {
              logger.error(`Validation error: ${err.message}`);
              throw Boom.badRequest(`Invalid request payload input`);
            } else {
              logger.error(`Validation error: ${err.message}`);
              throw err;
            }
          }
        },
        timeout: {
          server: 6000000, // ms
          socket: 8000000 // ms
        }
      },
      // tls: {
      //   key: fs.readFileSync('/path/to/ssl/www.garuda.com.key', 'utf8'),
      //   cert: fs.readFileSync('/path/to/ssl/www.garuda.com.certchain.crt', 'utf8')
      // },
      cache: [{
        name: 'mongoCache',
        engine: require('catbox-mongodb'),
        host: '127.0.0.1',
        partition: 'cache'
      }]
    });
    if (configs.routePrefix) {
      server.realm.modifiers.route.prefix = configs.routePrefix;
    }
    //  Setup Hapi Plugins
    const plugins: Array<string> = configs.plugins;
    const pluginOptions = {
      database: database,
      serverConfigs: configs
    };

    let pluginPromises: Promise<any>[] = [];

    plugins.forEach((pluginName: string) => {
      let plugin: IPlugin = require('./../plugins/' + pluginName).default();
      logger.info(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
      pluginPromises.push(plugin.register(server, pluginOptions));
    });

    await Promise.all(pluginPromises);

    // server.register({
    //   plugin: require('hapi-auth-cookie')
    // });
    // let options = {
    //   password: "theresdsidsandkindfjdWWKDJNCKLMMLxvcmvkd"
    // };
    // server.auth.strategy('session', 'cookie', options); // your TODO: options -> there are required ones

    // setup server session
    // Set cookie definition
    // server.state('session', {
    //   ttl: 60 * 60 * 1000,
    //   isHttpOnly: true,
    //   isSecure: false,
    //   encoding: 'iron',
    //   password: 'a5LewP10pXNbWUdYQakUfVlk1jUVuLuUU6E1WEE302k'
    // });
    // server.state('session', {
    //   ttl: 24 * 60 * 60 * 1000,     // One day
    //   isSecure: true,
    //   // path: '/',
    //   encoding: 'base64json'
    // });

    logger.info('All plugins registered successfully.');
    logger.info('Register Routes');

    User.init(server, configs, database, logger);
    admin.init(server, configs, database, logger);
    Organization.init(server, configs, database, logger);
    file.init(server, configs, database, logger);
    assets.init(server, configs, database, logger);
    marketplace.init(server, configs, database, logger);
    gov.init(server, configs, database, logger);
    transfer.init(server, configs, database, logger);

    search.init(server, configs, database, logger);

    explorer.init(server, configs, database, logger);
    Wallet.init(server, configs, database, logger);

    web3.init(server, configs, database, logger);
    transaction.init(server, configs, database, logger);


    socket.init(server, configs, database, logger);
    document.init(server, configs, database, logger);
    certificate.init(server, configs, database, logger);

    sawtooth.init(server, configs, database, logger);

    logger.info('Routes registered successfully.');
    return server;
  } catch (err) {
    logger.error('Error starting server: ', err);
    throw err;
  }
}