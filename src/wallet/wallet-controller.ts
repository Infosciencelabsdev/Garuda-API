import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations, Web3Configuration } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import * as uuid from 'uuid';
import Web3Controller from "../web3/web3-controller";
import web3Class from "../web3/web3-controller";
import { HeapProfiler } from "inspector";

const API_KEY = 'Nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
export var etherscanApi = require('etherscan-api').init(API_KEY, 'rinkeby', '3000');
export default class WalletController {
  web3Controller = new web3Class(this.server, this.configs, this.database, this.logger);

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
*  Retrieve the token for the supplied passport credentials
*  This token can be used to authenticate the front-end on the Composer REST server
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  // async createWallet(request: IRequest, h: Hapi.ResponseToolkit) {
  //   const identity = request.auth.credentials.id;
  //   try {
  //     // let payload: any = request.payload;
  //     let wallet = await this.web3Controller.createSethAccount(identity);
  //     console.log(wallet);
  //     return h.response(wallet).code(200);
  //   } catch (error) {
  //     return Boom.boomify(error);
  //   }
  // }
  /**
 * API route
 *  Update the user role
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
  async changeRole(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let payload: any = request.payload;
      let passport = await this.database.passportModel.findOne({ email: payload.email }).lean(true);
      if (!passport) {
        return Boom.notFound("User not registered.");
      }
      let res = await this.database.passportModel.update({ email: payload.email }, { roleId: payload.roleId });
      return h.response(res).code(200);
    } catch (error) {
      return h.response(error).code(501);
    }
  }
  /**
 * API route
 *  Update the user role
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
  // async getWallet(request: IRequest, h: Hapi.ResponseToolkit) {
  //   try {
  //     let payload = request.payload;
  //     let email = payload['email'];
  //     let password = payload['password'];
  //     let dbCipher = await this.database.cipherModel.findOne({ email: email });
  //     // To Do: match email and password

  //     let obj = Object.assign({}, dbCipher);
  //     const object = obj['_doc'];
  //     delete object['email'];
  //     // let response = await this.web3Controller.decryptWallet(object, password);
  //     return h.response(response).code(200);
  //   } catch (error) {
  //     return Boom.badImplementation(error);
  //   }
  // }
  /**
 * API route
 *  Update the user role
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
  async getWalletBalance(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      // let payload = request.payload;
      // let password = payload['password'];
      let user = await this.database.passportModel.findOne({ email: identity }).lean(true);
      // console.log(user);
      if (!user) {
        return Boom.notFound("Unable to find user!");
      }
      let dbCipherCheck = await this.database.cipherModel.findOne({ email: identity }).lean(true);
      let dbCipher = await this.database.cipherModel.findOne({ email: identity });
      // console.log(dbCipherCheck);
      // console.log(dbCipher);
      if (!dbCipherCheck) {
        try {
          // let wallet = await this.web3Controller.createWallet(identity, identity);
          // await this.web3Controller.addUser(wallet.address, 0, 'admin@garuda.com', uuid.v4());
          let wallet:any;
          wallet.address = null;
          await this.database.passportModel.findOneAndUpdate({ email: identity }, { walletAddress: wallet.address });
          let response = {
            publicKey: wallet.address,
            balance: 0,
            units: "ether"
          };
          return h.response(response).code(200);
        } catch (error) {
          return Boom.badRequest(error);
        }
      }
      // var balance = await api.account.balance('0xa16854F9BE984369A80754a0B77557ee63610680');
      let publicKey = "0x".concat(dbCipher.address);
      var balance = await etherscanApi.account.balance(publicKey);
      // // To Do: match email and password
      let response = {
        publicKey: publicKey,
        balance: balance.result / 1e18,
        units: "ether"
      };
      // balance.result = balance.result / 1e18;
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
* API route
*  Request balance in user wallet
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async requestBalance(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      // let payload = request.payload;
      // let password = payload['password'];
      let users = await this.database.passportModel.find({ email: identity }).limit(1);
      let user = users[0];
      if (!user) {
        return Boom.notFound("Unable to find user!!!!!!!!!!!");
      }
      let dbCipherCheck = await this.database.cipherModel.findOne({ email: identity }).lean(true);
      let dbCipher = await this.database.cipherModel.findOne({ email: identity });
      // console.log(dbCipherCheck);
      // console.log(dbCipher);
      if (!dbCipherCheck) {
        try {
          // let wallet = await this.web3Controller.createWallet(identity, identity);
          // await this.web3Controller.addUser(wallet.address, 0, 'admin@garuda.com', uuid.v4());
          let wallet:any;
          wallet.address = null;
          await this.database.passportModel.findOneAndUpdate({ email: identity }, { walletAddress: wallet.address });
          let response = {
            publicKey: wallet.address,
            balance: 0,
            units: "ether"
          };
          // await this.web3Controller.transferEther(response.publicKey, 5e9, identity, uuid.v4());
          return h.response(response).code(200);
        } catch (error) {
          return Boom.badRequest(error);
        }
      }      // var balance = await api.account.balance('0xa16854F9BE984369A80754a0B77557ee63610680');
      let publicKey = "0x".concat(dbCipher.address);
      var balance = await etherscanApi.account.balance(publicKey);
      if (balance.result && balance.result > 1e9) {
        return Boom.badRequest("Testnet balance already available");
      }
      // // To Do: match email and password
      let response = {
        publicKey: publicKey,
        balance: balance.result / 1e18,
        units: "ether"
      };
      // const web3Object = new web3Class(this.configs, this.database, this.logger);
      // let data = await this.web3Controller.transferEther(publicKey, 5e9, identity, uuid.v4());
      // let wallet = await this.database.walletModel.find({ userId: user.id }).limit(1).lean(true);
      // balance.result = balance.result / 1e18;
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
 * API route
 *  Check user wallet balance
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
async checkWalletBalance(wallet, amount) {
  try {
    let publicKey = "0x".concat(wallet.address);
    var balance = await etherscanApi.account.balance(publicKey);
    if ( balance >= amount) {
      return true;
    }
    return false;
  } catch (error) {
    return Boom.boomify(error);
  }
}
}