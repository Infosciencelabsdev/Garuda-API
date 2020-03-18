import * as Hapi from "hapi";
import Routes from "./routes";
import { IDatabase } from "../database/database";
import { IServerConfigurations, Web3Configuration } from "../configurations";
import { LoggerInstance } from 'winston';

export function init(
  server: Hapi.Server,
  configs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance
) {
  Routes(server, configs, database, logger);
}
