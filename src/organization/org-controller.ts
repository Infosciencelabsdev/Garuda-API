import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import * as uuid from 'uuid';
import Web3Class from "../web3/web3-controller";
import { IOrganization, Organization } from "./org";

export default class OrganizationController {
  web3Controller = new Web3Class(this.server, this.configs, this.database, this.logger);

  /**
   * Constructor
   * @param {IServerConfigurations} configs
   * @param {IDatabase} database
   * @param {winston.LoggerInstance} logger
   */
  constructor(
    private server: Hapi.Server,
    private configs: IServerConfigurations,
    private database: IDatabase,
    private logger: LoggerInstance) {
  }
  /**
* API route
*  Create the organizationa dn org admin passport
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async createOrg(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    let payload: any = request.payload;
    try {
      await this.hasPermission(identity, "admin");
      var organization = await this.database.organizationModel.findOne({ email: payload.email });
      let passport = await this.database.passportModel.findOne({ email: payload.email }).lean(true);
      if (organization && passport) {
        return Boom.badRequest("Builder email already exists");
      }
      // let web3Controller = new Web3Controller(this.configs, this.database, this.logger);
      // const wallet = await this.web3Controller.createWallet(payload.email, payload.password);

      let wallet:any;
      wallet.address = null;

      let org: Organization = {
        orgId: uuid.v4(),
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        name: payload.name,
        gst: payload.gst,
        walletAddress: wallet.address,
        address: {
          street: payload.street,
          city: payload.city,
          state: payload.state,
          country: payload.country,
          zip: payload.zip,
        },
        admin: payload.admin
      };
      // create new passport
      if (!passport) {
        passport = {
          userId: uuid.v4(),
          email: payload.email,
          walletAddress: wallet.address,
          name: payload.name,
          phone: payload.phone,
          dob: payload.dob,
          password: payload.password, // setting password to test for dev
          roleId: "builder",
          orgId: org.orgId
        };
        await this.database.passportModel.create(passport);
      }
      let response = await this.database.organizationModel.create(org);
      delete response.password;
      return h.response(response).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  /**
* API route
*  Get all the registered user
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getAllOrg(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let params = request.params;
      let page = params["page"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      console.log(" limit : " + limit + " size: " + size);
      let res = await this.database.organizationModel.find({}).select('-_id -__v -password').limit(limit).skip(size);
      let count = await this.database.organizationModel.find().count({});
      let response = { data: res, lastPage: { index: count, page: Math.ceil(count / 10) } };
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Get user by id
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let params = request.params;
      let id = params["id"];
      let response = await this.database.organizationModel.find({ id: id }).select('-_id -__v -password');
      return h.response(response).code(200);
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