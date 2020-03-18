import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import { PassportModel } from "../user/user";
import * as webpush from 'web-push';
import uuid = require("uuid");
const PUBLIC_VAPID = 'BNOJyTgwrEwK9lbetRcougxkRgLpPs1DX0YCfA5ZzXu4z9p_Et5EnvMja7MGfCqyFCY4FnFnJVICM4bMUcnrxWg';
const PRIVATE_VAPID = '_kRzHiscHBIGftfA7IehH9EA3RvBl8SBYhXBAMz6GrI';
webpush.setVapidDetails('mailto:rajat@cognier.co', PUBLIC_VAPID, PRIVATE_VAPID);



export default class PushController {
  myMembersAutoComplete: any;
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
    // Autocomplete configuration
    var configuration = {
      //Fields being autocompleted, they will be concatenated
      autoCompleteFields: ["email", "name"], //"name",
      //Returned data with autocompleted results
      dataFields: ["_id"],
      //Maximum number of results to return with an autocomplete request
      maximumResults: 10,
      //MongoDB model (defined earlier) that will be used for autoCompleteFields and dataFields
      model: PassportModel
    };

    // //initialization of AutoComplete Module
    // this.myMembersAutoComplete = new AutoComplete(configuration, function () {
    //   //any calls required after the initialization
    //   console.log("Loaded " + this.myMembersAutoComplete.getCacheSize() + " words in auto complete");
    // });
  }
  /**
* API route
*  Subscribe user to socket
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async subscription(user) {
    try {
      let socket = {
        id: uuid.v4(),
        userId: user.id
      };
      await this.database.eventModel.create(socket);
      return true;
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Get all the registered user
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async sendNotification() {
    try {
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
  * Check the user is has permissions or not
  * @param {string} identity
  * @param {string} roleId
  * @returns {string}
  */
  async hasPermission(identity: string, roleId: string) {
    let adminPassport = await this.database.passportModel.findOne({ email: identity });
    if (!adminPassport && adminPassport.roleId === roleId) {
      return Boom.unauthorized("User not authorised to perform action.");
    }
    return true;
  }

  async subscribe(userId, ) {
    return true;
  }
  //  async
}