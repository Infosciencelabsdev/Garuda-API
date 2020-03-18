import * as Hapi from "hapi";
import PassportController from "./admin-controller";
import * as PassportValidator from "./admin-validator";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const passportController = new PassportController(serverConfigs, database, logger);
    server.bind(passportController);

}
