import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import * as uuid from 'uuid';

export default class AdminController {

  /**
   * Constructor
   * @param {IServerConfigurations} configs
   * @param {IDatabase} database
   * @param {winston.LoggerInstance} logger
   */
  constructor(
    private configs: IServerConfigurations,
    private database: IDatabase,
    private logger: LoggerInstance) {
  }


}