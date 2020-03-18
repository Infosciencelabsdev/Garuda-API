import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { IPassport, createUserModel, updateUserModel } from "./user";
import { LoggerInstance } from 'winston';
import { ILoginRequest, IRequest } from '../interfaces/request';
import EmailController from "../communication/email-controller";
import SendOTP from 'sendotp-promise';
import * as uuid from 'uuid';
import { ICipher } from "../wallet/wallet";
import web3Class from "../web3/web3-controller";
import { io } from "../socket/socket-controller";
import SawtoothController from "../saw-client/sawtooth-controller";
import { etherscanApi } from "../wallet/wallet-controller";
import { EUser } from "../explorer/explorer";
import { addDataToDB } from "../database/rethink";
// const internals = {};

// let uid = 1;
export default class UserController {
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
    // super(configs, database, logger);
  }
  /**
* API route
*  Retrieve the token for the supplied passport credentials
*  This token can be used to authenticate the front-end on the Composer REST server
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async registerUser(request: IRequest, h: Hapi.ResponseToolkit) {
    let payload: any = request.payload;
    try {

      // Create passport for the customer(user) so he or she can login with username/password
      let passport = await this.database.passportModel.findOne({ email: payload.email }).lean(true);
      if (passport) {
        return Boom.badRequest("Email already exists");
      }
      const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
      // let web3Controller = new web3Class(this.configs, this.database, this.logger);
      // let wallet = await this.web3Controller.createWallet(payload.email, payload.email);
      // await this.web3Controller.addUser(wallet.address, 0, 'admin@garuda.com', uuid.v4());
      // await this.web3Controller.transferEther(wallet.address, 5e9, 'admin@garuda.com', uuid.v4());
      // CHANGED
      let wallet:any = {};
      wallet.address = null;

      let user = await createUserModel(payload, wallet);
      let response = await this.database.passportModel.create(user);
      let sawclass = new SawtoothController(this.configs, this.database, this.logger);
      // let privateKey = await sawclass.createAccount(response);
      const signer = await sawclass.getSigner(user.userId, user.email);
      let eUser: EUser = {
        // assetId: user.userId,
        hash:  signer.getPublicKey().asHex(),
        type: "User",
        transactions: [],
        certificates: [],
        contracts: [],
        assets: [],
      };
      await addDataToDB("User", eUser);
      return h.response(response).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  // async addUser(address: string) {
  //   // web3.eth
  //   const query = contractEth.methods.addUser(address)
  //     .encodeABI();
  //   const web3Object = new web3Class(this.configs, this.database, this.logger);
  //   let identity = 'r@cogneirmail.com';
  //   let data = web3Object.signTransaction(wallet, query, identity);
  //   return address;
  // }
  /**
 * API route
 *  Retrieve the token for the supplied passport credentials
 *  This token can be used to authenticate the front-end on the Composer REST server
 * @param {ILoginRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
  async getLoginToken(request: any, h: Hapi.ResponseToolkit) {
    const email = request.payload.email;
    const password = request.payload.password;
    const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    this.logger.info(`retrieving token for passport ${email} ...`);

    let passport: IPassport = await this.database.passportModel.findOne({ email: email });
    let wallet: ICipher = await this.database.cipherModel.findOne({ email: email });
    // Check if the passport exists
    if (!passport) {
      return Boom.unauthorized("Account does not exists.");
    }
    // console.log(passport);
    // console.log(wallet);
    // if (passport.walletAddress.charAt(0) !== '0' || passport.walletAddress.charAt(1) !== 'x') {
    //   passport.walletAddress = "0x".concat(passport.walletAddress);
    // }
    // var balance;
    // if (passport.walletAddress) {
    //   let publicKey = "0x".concat(passport.walletAddress);
    //   balance = await etherscanApi.account.balance(publicKey);
    // }
    // Validate password
    if (!passport.validatePassword(password)) {
      return Boom.unauthorized("Password is invalid.");
    }
    let timestamp = new Date();
    let account = {
      token: this.generateToken(passport),
      id: passport.id,
      name: passport.name,
      email: passport.email,
      roleId: passport.roleId,
      orgId: passport.orgId ? passport.orgId : null,
      walletAddress: passport.walletAddress,
      // balance: passport.walletAddress ? (balance.result / 1e18) : 0,
      address: passport.address ? passport.address : null
    };
    // request.yar.set(email, passport);
    // const emailController = new EmailController();
    // await emailController.signinemail(res.name, res.email, timestamp, ip);
    return h.response(account).code(200);
  }
  /**
* API route
*  Retrieve the token for the supplied passport credentials
*  This token can be used to authenticate the front-end on the Composer REST server
* @param {ILoginRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async LogoutSession(request: any, h: Hapi.ResponseToolkit) {
    const email = request.payload.email;
    delete request.session;
    request.server.app.cache.drop(request.state['sid-example'].sid);
    request.cookieAuth.clear();
    // const emailController = new EmailController();
    // await emailController.signinemail(res.name, res.email, timestamp, ip);
    return h.response("res").code(200);
  }
  /**
   * Generate a Json Web Token for the user request
   * @param {IPassport} passport
   * @returns {string}
   */
  private generateToken(passport: IPassport): string {
    let jwtSecret = this.configs.jwt.secret;
    const jwtExpiration = this.configs.jwt.expiration;
    const payload = { id: passport.email, role: passport.roleId };

    return Jwt.sign(payload, jwtSecret, {
      expiresIn: jwtExpiration,
      subject: `${passport.name}`,
      algorithm: this.configs.jwt.algorithm,
      issuer: this.configs.jwt.issuer,
      audience: this.configs.jwt.audience
    });
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
      let page = params["page"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      console.log(" limit : " + limit + " size: " + size);
      let res = await this.database.passportModel.find({}).sort({ createdAt: 'desc' }).select('-_id -__v -password').limit(limit).skip(size);
      let count = await this.database.passportModel.find().count({});
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
  async getByid(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let params = request.params;
      let id = params["id"];
      let response = await this.database.passportModel.find({ id: id }).select('-_id -__v -password');
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
  * API route
  *  Retrieve the token for the supplied passport credentials
  *  This token can be used to authenticate the front-end on the Composer REST server
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async createUser(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let payload: any = request.payload;
      // Create passport for the user to login with username/password
      let passport = await this.database.passportModel.findOne({ email: payload.email });
      if (passport) {
        return Boom.badRequest("Email already exists");
      }
      // let wallet = await this.web3Controller.createWallet(payload.email, payload.email);
      const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
      // Link user address to ethereum/sawtooth contract

      let wallet:any = {};
      wallet.address = 'any';
      let user = await createUserModel(payload, wallet);
      // await this.web3Controller.addUser(wallet.address, user.role, identity, uuid.v4());
      // await this.web3Controller.transferEther(wallet.address, 5e9, identity, uuid.v4());
      // await this.database.transactionModel.
      let sawclass = new SawtoothController(this.configs, this.database, this.logger);
      // let privateKey = await sawclass.createAccount(user);
      const signer = await sawclass.getSigner(user.userId, user.email);
      user.walletAddress = signer.getPublicKey().asHex();
      let response = await this.database.passportModel.create(user);
      let eUser: EUser = {
        // assetId: user.userId,
        hash:  signer.getPublicKey().asHex(),
        type: "User",
        transactions: [],
        certificates: [],
        contracts: [],
        assets: [],
      };
      await addDataToDB("User", eUser);
      // let privateKey = await createSawtoothKey(response, this.database);
      return h.response(response).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }

  /**
* API route
*  Update the user role
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async updateProfile(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      // let admin = await this.hasPermission(identity, "admin");
      let payload: any = request.payload;
      let passport = await this.database.passportModel.findOne({ email: payload.email });
      if (passport == null) {
        return Boom.notFound("User not registered.");
      }
      let updatedPassport = await updateUserModel(passport, payload);
      let res = await this.database.passportModel.findOneAndUpdate({ email: payload.email }, updatedPassport);
      return h.response(res).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  /**
* API route
*  Update the user role
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async deleteUser(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let admin = await this.hasPermission(identity, "admin");
      let payload: any = request.payload;
      let passport = await this.database.passportModel.findOne({ email: payload.email });
      if (passport == null) {
        return Boom.notFound("User not registered.");
      }
      let response = await this.database.passportModel.findOneAndRemove({ email: payload.email });
      return h.response(response).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
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
      await this.hasPermission(identity, "admin");
      let payload: any = request.payload;
      let passport = await this.database.passportModel.findOne({ email: payload.email }).lean(true);
      if (!passport) {
        return Boom.notFound("User not registered.");
      }
      let res = await this.database.passportModel.update({ email: payload.email }, { roleId: payload.roleId });
      return h.response(res).code(200);
    } catch (error) {
      return Boom.boomify(error);
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