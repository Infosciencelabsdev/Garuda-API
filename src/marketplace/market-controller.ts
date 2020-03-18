import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import { ICipher } from "../wallet/wallet";
import web3Class from "../web3/web3-controller";
import uuid = require("uuid");
import { marketplaceModel } from "./marketplace";
import { Status as PropertyStatus } from "../assets/asset";
import SawtoothController from "../saw-client/sawtooth-controller";
import { etherscanApi } from "../wallet/wallet-controller";

export default class AssetController {
  // web3Controller = new web3Class(this.server, this.configs, this.database, this.logger);
  // sawtoothController = new SawtoothController(this.configs, this.database, this.logger);

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
*  Decrypt the user wallet
* @param {IP} property
* @param {string} password
* @returns {Promise<any>}
*/
  async listProperty(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    const session = request.yar.get(identity);
    const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    const payload: any = request.payload;
    let propertyId = payload.propertyId;
    try {
      // let user = await this.database.passportModel.findOne({ email: identity });
      // let accountCipher: ICipher = await this.database.cipherModel.findOne({ email: identity });
      // // let account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // var balance = await etherscanApi.account.balance(user.walletAddress);
      // if (user.walletAddress.charAt(0) !== '0' || user.walletAddress.charAt(1) !== 'x') {
      //   user.walletAddress = "0x".concat(user.walletAddress);
      // }
      // if (balance < 1e9) {
      //   return Boom.paymentRequired(" Insufficient balance in ethereum wallet");
      // }
      let property = await this.database.propertyModel.findOne(
        { propertyId: propertyId });
        // .select('+hash');
      let marketproperty = await this.database.marketplaceModel.findOne({ propertyId: propertyId });
      let key = await this.database.sawtoothModel.findOne({ email: identity }).select('-privateKey._id -privateKey.__v');
      let privateKey;
      // if (key == null) {
      //   privateKey = await this.sawtoothController.createAccount(user);
      //   // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
      // } else {
      //   privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
      //   // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);
      // }
      payload.id = uuid.v4();
      payload.action = 'list';
      if (!property) {
        return Boom.badData("Property doesn't exist");
      } else if (property.status <= PropertyStatus.Pending) {
        // console.log(" status of property is " + property.status);
        return Boom.badRequest("Property not verified");
      } else if (marketproperty && marketproperty.isActive) {
        return Boom.badData("Property already in marketplace");
      } else if (marketproperty && !marketproperty.isActive) {
        console.log(" else if ");
        let marketplace = marketplaceModel(payload, property, identity);

        property = await this.database.propertyModel.findOneAndUpdate(
          { propertyId: propertyId }, { status: PropertyStatus.Listed }, { new: true });
          // .select('+hash');
        let response = await this.database.marketplaceModel.findOneAndUpdate({ propertyId: propertyId }, marketplace);
        // if
        // await this.web3Controller.ListMarketplace(account, property, identity, "Sell", privateKey, payload);
        return response;
      }

      let marketplace = marketplaceModel(payload, property, identity);
      property = await this.database.propertyModel.findOneAndUpdate(
        { propertyId: propertyId }, { status: PropertyStatus.Listed }, { new: true });
        // .select('+hash');
      let response = await this.database.marketplaceModel.create(marketplace);
      // let resp = await this.web3Controller.ListMarketplace(account, property, identity, "Sell", privateKey, payload);
      console.log(response);
      return response;
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
* API route
*  Update the user role
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getMarketplace(request: IRequest, h: Hapi.ResponseToolkit) {
    try {
      let params = request.params;
      let page = params["page"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      // console.log(" limit : " + limit + " size: " + size);
      let result = await this.database.marketplaceModel.find({ isActive: true }).sort({ createdAt: 'desc' }).limit(limit).skip(size);
      let count = await this.database.marketplaceModel.find({ isActive: true }).count({});
      let response = { data: result, lastPage: { index: count, page: Math.ceil(count / 10) } };
      return h.response(response).code(200);
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
  async getMarketById(request: IRequest, h: Hapi.ResponseToolkit) {
    let params = request.params;
    let id = params["id"];
    try {
      let result = await this.database.marketplaceModel.findOne({ propertyId: id, isActive: true }).
        select('-_id -id -__v -updatedAt -createdAt -hash -publicKey');
      return h.response(result).code(200);
      // let account: ICipher = await this.database.cipherModel.findOne({ email: identity });
      // if (!account) {
      //   return Boom.notFound("unable to find linked wallets");
      // }
      // let web3Controller = new Web3Controller(this.configs, this.database, this.logger);
      // try {
      //   let propertyDetails = await web3Controller.getProperty(account);
      //   return propertyDetails;
      // } catch (error) {
      //   return Boom.boomify(error);
      // }
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
* API route
*  Get all the properties of user
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getUserListing(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let params = request.params;
      let page = params["page"];
      let userId = params["userId"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      let result = await this.database.marketplaceModel.find({ 'ownedBy': userId, isActive: true }).
        select('-_id -id -__v -updatedAt -createdAt -hash -publicKey -owner._id -ownedBy').limit(limit).skip(size)
        .populate('owner').exec();
      let count = await this.database.marketplaceModel.find({ 'ownedBy': userId }).count({});
      let response = { data: result, lastPage: { index: count, page: Math.ceil(count / 10) } };
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
  * Check the user has permissions or not
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
  /**
* API route
*  Decrypt the user wallet
* @param {IP} property
* @param {string} password
* @returns {Promise<any>}
*/
  async delistProperty(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    const session = request.yar.get(identity);
    const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    const payload: any = request.payload;
    let propertyId = payload.propertyId;
    try {
      let account: ICipher = await this.database.cipherModel.findOne({ email: identity });
      let property = await this.database.propertyModel.findOneAndUpdate(
        { propertyId: propertyId }, { status: PropertyStatus.Approved }, { new: true });
      let marketproperty = await this.database.marketplaceModel.findOneAndUpdate({ propertyId: propertyId }
        , { status: PropertyStatus.Approved, isActive: false }, { new: true });
      // remove from bid requests
      return h.response(marketproperty).code(200);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}