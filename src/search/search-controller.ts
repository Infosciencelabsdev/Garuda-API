import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import * as AutoComplete from 'mongoose-in-memory-autocomplete';
import { PassportModel } from "../user/user";
import * as webpush from 'web-push';
const PUBLIC_VAPID = 'BNOJyTgwrEwK9lbetRcougxkRgLpPs1DX0YCfA5ZzXu4z9p_Et5EnvMja7MGfCqyFCY4FnFnJVICM4bMUcnrxWg';
const PRIVATE_VAPID = '_kRzHiscHBIGftfA7IehH9EA3RvBl8SBYhXBAMz6GrI';
webpush.setVapidDetails('mailto:rajat@cognier.co', PUBLIC_VAPID, PRIVATE_VAPID);
export default class SearchController {
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
*  Get all the registered user
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getAllUsers(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let params = request.params;
      let keyword = params["keyword"];
      // var regex = new RegExp(keyword, 'i');
      let query = {
        "$or": [{ "email": { "$regex": keyword, "$options": "i" } }, { "name": { "$regex": keyword, "$options": "i" } }]
      };
      let res = await this.database.passportModel.find(query, { 'name': 1, 'email': 1 }).sort({ "updated_at": -1 }).sort({ "created_at": -1 }).limit(20);
      // let res = await this.database.passportModel.find({ name: regex }, { 'name': 1 }).sort({ "updated_at": -1 }).sort({ "created_at": -1 }).limit(20);
      // let response = { data: res, lastPage: { index: count, page: Math.ceil(count / 10) } };
      // var query = User.find({fullname: regex}, { 'fullname': 1 }).sort({"updated_at":-1}).sort({"created_at":-1}).limit(20);
      //Finding in the autocomplete
      //
      // Lets say we have in mongodb a document -> { firstName : "James", lastName: "Green", _id: "535f06a28ddfa3880f000003"}
      // getResults will return words -> [{"word": "James Green","data": ["535f06a28ddfa3880f000003"]}]
      //
      // this.myMembersAutoComplete.getResults(keyword, function (err, words) {
      //   if (err) {
      //     return Boom.boomify(err);
      //   } else {
      //     return h.response(words).code(200);
      //   }
      // });
      return h.response(res).code(200);
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
async getAllOrgs(request: IRequest, h: Hapi.ResponseToolkit) {
  const identity = request.auth.credentials.id;
  try {
    await this.hasPermission(identity, "admin");
    let params = request.params;
    let keyword = params["keyword"];
    let query = {
      "$or": [{ "email": { "$regex": keyword, "$options": "i" } }, { "name": { "$regex": keyword, "$options": "i" } }]
    };
    let res = await this.database.organizationModel.find(query, { 'name': 1, 'email': 1 }).sort({ "updated_at": -1 }).sort({ "created_at": -1 }).limit(20);
    return h.response(res).code(200);
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

}