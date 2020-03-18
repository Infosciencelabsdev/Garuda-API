import * as Hapi from "hapi";
import Controller from "./socket-controller";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const controller = new Controller(server, serverConfigs, database, logger);
    server.bind(controller);
}
