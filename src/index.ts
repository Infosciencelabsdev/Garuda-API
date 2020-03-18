import * as Server from "./server/server";
import * as Configs from "./configurations";
import * as winston from "winston";
import { LoggerInstance } from 'winston';
import { MongoDatabase } from './database/mongo-database';
import { IServerConfigurations, Web3Configuration } from './configurations/index';
import { IDatabase } from './database/database';
import Web3Connection from "./web3/web3-controller";
import SawtoothController from "./saw-client/sawtooth-controller";
import * as Hapi from "hapi";


const { TransactionProcessor } = require('sawtooth-sdk/processor');

import ExpHandler from '../src/t-processor/explorer_handler';
import { env } from '../src/saw-client/env';

/**
 * Create winston logger
 * @returns {winston.LoggerInstance}
 */
function createLogger(): LoggerInstance {
  // create logger
  const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'rest-server.log' })
    ]
  });

  logger.info(`Running enviroment ${process.env.NODE_ENV || "dev"}`);

  // Catch unhandling unexpected exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error(`uncaughtException ${error.message}`);
  });

  // Catch unhandling rejected promises
  process.on('unhandledRejection', (reason: any) => {
    logger.error(`unhandledRejection ${reason}`);
  });
  return logger;
}

/**
 * Initialize
 * @returns {Promise<void>}
 */
async function initialize() {
  // logger
  const logger = createLogger();

  // Init Database
  const dbConfigs = Configs.getDatabaseConfig();
  const database = new MongoDatabase(dbConfigs, logger);
  // const web3Config = Configs.getWeb3Config();
  // const web3Connection = createWeb3Connection(web3Config, logger);


  await database.initialize();

  // Get application configs
  const serverConfigs = Configs.getServerConfigs();
  const web3Configs = Configs.getWeb3Config();
  logger.info("Creating admin passport");


  // Start transaction processor
  // await InitProcessor(logger);
  const server = await Server.init(serverConfigs, database, logger, web3Configs);
  await addAdminPassport(server, serverConfigs, database, logger);

  try {
    await server.start();
    let time = new Date();
    logger.info(`server is running at ${server.info.uri}`);
    logger.info(`server started at ${time}`);
  } catch (err) {
    logger.error(err);
  }
}
async function InitProcessor(logger: LoggerInstance) {
  const transactionProcessor = new TransactionProcessor(env.validatorUrl);

  const handler: ExpHandler = new ExpHandler();
  // Add Transaction Processor Handler to TP
  transactionProcessor.addHandler(handler);

  logger.info(`Starting garuda transaction processor`);
  // Start Transaction Processor
  transactionProcessor.start();

  logger.info(`Connecting to Sawtooth validator at ${env.validatorUrl}`);

}
/**
 * Adding the admin user
 * Add the already registred business network card to our mongodb cardstore
 * Create passport for this admin user
 * @param {IDatabase} database
 * @param composerConnection
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
async function addAdminPassport(server: Hapi.Server,
  configs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance) {
  let web3Instance = new Web3Connection(server, configs, database, logger);
  const Passport = {
    id: 5,
    userId: 5,
    adminId: 5,
    email: 'admin@garuda.com',
    phone: 8059902755,
    // dob: ,
    walletAddress: "0xa16854F9BE984369A80754a0B77557ee63610680",
    username: 'testadmin',
    name: 'test',
    password: 'password',
    roleId: 'admin',
    address: {
      street: "Financial district",
      city: "Hyderabad",
      state: "Telanagana",
      country: "India",
      zip: 500032
    },
    role: 3
  };
  let count = await database.passportModel.find({ email: Passport.email }).count();
  if (count < 1) {
    return await database.passportModel.create(Passport);
  }
  let privatekey = await database.sawtoothModel.find({ email: Passport.email }).count();
  if (privatekey < 1) {
    let sawclass = new SawtoothController(configs, database, logger);
    let privateKey = await sawclass.createAccount(Passport);
  }
  // let account = await database.cipherModel.find({ email: Passport.email }).count();
  // if (account < 1) {
  //   return await web3Instance.createAdminWallet(Passport.email, Passport.email);
  // } else {
  //   Passport.password = "$2a$10$zimd56Uplibsvkdn2ZY6iuWurGLk8wRguQvyV7kZc9darLDnH/1pq";
  //   return await database.passportModel.findOneAndUpdate({ email: Passport.email }, Passport, { upsert: true });
  // }

}
initialize();