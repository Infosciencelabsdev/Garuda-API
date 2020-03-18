import * as Hapi from "hapi";
import * as Boom from "boom";
import {IDatabase} from "../database/database";
import {IServerConfigurations} from "../configurations";
import {LoggerInstance} from 'winston';
import {IRequest} from '../interfaces/request';
import * as requestExternal from 'request-promise-native';
import {Status} from "./asset";
import {ICipher} from "../wallet/wallet";
// import web3Class from "../web3/web3";
import web3Class from "../web3/web3-controller";
import uuid = require("uuid");
import {certificateModel, Certificate} from "../certificates/certificate";
import SawtoothController, {context} from "../saw-client/sawtooth-controller";
import {etherscanApi} from "../wallet/wallet-controller";
import {eventType, urls, UserNotification} from "../notification/push";
import SocketController from "../socket/socket-controller";
import {roles} from "../user/user";
import {EProperty, ECertificate, EUser} from "../explorer/explorer";
import {addDataToDB, filterData, r} from "../database/rethink";
const crypto = require("crypto");

export default class AssetController {
  socketController = new SocketController(this.server, this.configs, this.database, this.logger);
  web3Controller = new web3Class(this.server, this.configs, this.database, this.logger);
  sawtoothController = new SawtoothController(this.configs, this.database, this.logger);

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
*  Get all the properties
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getAllProperties(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let isAdmin = await this.hasPermission(identity, "admin");
      let user = await this.database.passportModel.findOne({email: identity}).select('id');
      let userId = user.id;
      let params = request.params;
      let page = params["page"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      // console.log(" limit : " + limit + " size: " + size);
      let result;
      let count;
      if (isAdmin) {
        result = await this.database.propertyModel.find({}).sort({createdAt: 'desc'}).select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id').limit(limit).skip(size);
        count = await this.database.propertyModel.find().count({});
      } else {
        result = await this.database.propertyModel.find({'owner.id': userId, 'owner.sold': false}).sort({createdAt: 'desc'}).
          select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id').limit(limit).skip(size);
        count = await this.database.propertyModel.find({'owner.id': userId, 'owner.sold': false}).count({});
      }
      let response = {data: result, lastPage: {index: count, page: Math.ceil(count / 10)}};
      return h.response(response).code(200);
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
  async getUserProperties(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let params = request.params;
      let page = params["page"];
      let userId = params["userId"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      let result = await this.database.propertyModel.find({'ownedBy': userId}).
        select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id').limit(limit).skip(size);
      let count = await this.database.propertyModel.find({'ownedBy': userId}).count({});
      let response = {data: result, lastPage: {index: count, page: Math.ceil(count / 10)}};
      return h.response(response).code(200);
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
  async getUserSoldProperties(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      // await this.hasPermission(identity, "admin");
      let params = request.params;
      let page = params["page"];
      let userId = params["userId"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      // let user = await this.database.passportModel.findOne({ userId: userId });
      let properties = await this.database.propertyModel.find({'owner.id': userId, 'owner.sold': true}).
        select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id').limit(limit).skip(size);
      for (const property of properties) {
        for (const owner of property.owner) {
          let bid = await this.database.buyRequestModel.findOne({propertyId: property.propertyId, seller: {$in: [owner.id]}});
          // return bid;
          if (bid != null) {
            // console.log(bid.id);
            // console.log(bid);
            owner.contract = bid.id;
          }
        }
        let p = await this.database.propertyModel.findOneAndUpdate({propertyId: property.propertyId}, property, {new: true});
        // console.log(p);
        // property.save();
        // let contract = await this.database.contractModel.find({ id: bid.id });
      }
      let count = await this.database.propertyModel.find({'owner.id': userId, 'owner.sold': true}).count({});
      let response = {data: properties, lastPage: {index: count, page: Math.ceil(count / 10)}};
      return h.response(response).code(200);
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
  async getSoldProperties(request: IRequest, h: Hapi.ResponseToolkit) {
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
      let result = await this.database.propertyModel.find({'owner.sold': true}).
        select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id').limit(limit).skip(size);
      let count = await this.database.propertyModel.find({'owner.sold': true}).count({});
      let response = {data: result, lastPage: {index: count, page: Math.ceil(count / 10)}};
      return h.response(response).code(200);
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
  async getBoughtProperties(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let params = request.params;
      let page = params["page"];
      let userId = params["userId"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      let result = await this.database.propertyModel.find({'owner.id': userId, 'owner.bought': true, 'owner.sold': false}).
        select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id').limit(limit).skip(size);
      let count = await this.database.propertyModel.find({'owner.id': userId, 'owner.bought': true, 'owner.sold': false}).count({});
      let response = {data: result, lastPage: {index: count, page: Math.ceil(count / 10)}};
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
  async getPropertyById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let id = params["propertyId"];
    try {
      let result = await this.database.propertyModel.findOne({propertyId: id}).
        select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id');
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
*  Decrypt the user wallet
* @param {IP} property
* @param {string} password
* @returns {Promise<any>}
*/
  async createProperty(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    const payload: any = request.payload;
    try {
      let user = await this.database.passportModel.findOne({email: identity});
      let property = await this.database.propertyModel.findOne({name: payload.name}).lean(true);
      if (property) {
        return Boom.badData("Property with same name already exist");
      }
      // if (!user.address) {
      //   return Boom.badRequest("Address not found");
      // }
      let count = await this.database.propertyModel.find().count();
      payload.propertyId = uuid.v4();
      payload.id = payload.propertyId;
      // let accountCipher = await this.database.cipherModel.findOne({ email: identity });
      // let account;
      // if (accountCipher == null) {
      //   account = await this.web3Controller.createWallet(identity, identity);
      // } else {
      //   account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // }
      // let walletAddress: string;
      // let web3Controller = new web3Class(this.configs, this.database, this.logger);
      // let wallet = await web3Controller.createWallet(payload.email, payload.email);
      // let account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // if (!account) {
      //   walletAddress = "0xa16854F9BE984369A80754a0B77557ee63610680";
      // } else
      // if (account.address.charAt(0) !== '0' || account.address.charAt(1) !== 'x') {
      //   account.address = "0x".concat(account.address);
      // }
      // var balance = await etherscanApi.account.balance(account.address);
      // if (balance.result < 1e9) {
      //   return Boom.paymentRequired("Insufficient balance in ethereum wallet");
      // }
      // let propertyWallet = await this.web3Controller.createWallet(payload.propertyId, payload.propertyId);

      // payload.publicKey = propertyWallet.address;
      payload.verified = false;
      payload.addedBy = identity;
      payload.ownedBy = [];
      let signer: any;
      let owners = [];
      for (const owner of payload.owner) {
        owner.bought = false;
        owner.title = true;
        payload.ownedBy.push(owner.id);
        let user = await this.database.passportModel.findOne({userId: owner.id});
        signer = await this.sawtoothController.getSigner(user.userId, user.email);
        // console.log('Signer', signer);
        owners.push(signer.getPublicKey().asHex());
      }
      let hash = "c4f834".concat(crypto.createHash('sha512').update(payload.propertyId).digest('hex').toLowerCase().substring(0, 64));
      payload.hash = payload.propertyId;
      let eProperty: EProperty = {
        // assetId: payload.propertyId,
        hash: hash,
        type: "Property",
        owner: owners,
        certificates: [],
        contracts: [],
        transactions: []
      };
      // payload.owner.forEach(owner => {
      //   owner.bought = false;
      //   owner.title = true;
      //   payload.ownedBy.push(owner.id);
      // });
      payload.status = Status.Pending;
      payload.propId = count + 26;
      let find = true;
      while (!find) {
        let property = await this.database.propertyModel.find({propId: payload.propId});
        if (property) {
          payload.propId++;
          find = true;
        } else {
          find = false;
        }
      }
      // console.log('UPDATED PROPERTY ID ', payload.propId);
      payload.isActive = false; // true after succesful transactions in network
      // let trxId = uuid.v4();
      let trxId = uuid.v4();
      // console.log("TRX ID", trxId);
      payload.transaction = trxId;
      payload.action = 'create';
      // Object.prototype()
      // let address = Object.keys(payload.address).map(i => payload.address[i]);
      let {street, city, state, country, zip} = payload.address;
      let address = [street, city, state, country, zip];
      let key = await this.database.sawtoothModel.findOne({email: identity}).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.sawtoothController.createAccount(user);
      } else {
        privateKey = {privateKeyBytes: key.privateKey};
      }
      let result = await this.web3Controller.createProperty(payload, signer, owners);

      let UserNotification = new Array<UserNotification>();
      let government = await this.database.passportModel.find({role: roles.government});
      payload.publicKey = signer.getPublicKey().asHex();
      let response = await this.database.propertyModel.create(payload);
      if (government) {
        for (let index = 0; index < government.length; index++) {
          const gov = government[index];
          let userNotification: UserNotification = {
            userId: gov.userId,
            email: gov.email,
            read: false
          };
          UserNotification[index] = userNotification;
        }
        let notify = {
          id: uuid.v4(),
          UserNotification: UserNotification,
          title: "Property " + payload.name + " has been created",
          message: "Confirm the property: ",
          // icon?: string;
          url: urls.government.listingById + payload.propertyId,
          event: eventType.create_property
        };
        this.socketController.sendEvent(notify);
      }
      // (<{ io: any }> request.server.app).io.to().emit('new_notification', {title: "test", message: "test message"});
      return h.response(response).code(201);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
* API route
*  Decrypt the user wallet
* @param {IP} property
* @param {string} password
* @returns {Promise<any>}
*/
  async updateProperty(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    const payload: any = request.payload;
    const params: any = request.params;
    let propertyId = params["propertyId"];
    try {
      let property = await this.database.propertyModel.findOne({propertyId: propertyId});
      let account = await this.database.cipherModel.findOne({email: identity});
      let walletAddress;
      // let propertyWallet = await this.web3Controller.createWallet(payload.propertyId, payload.propertyId);
      if (!account) {
        walletAddress = "0xa16854F9BE984369A80754a0B77557ee63610680";
      } else {
        walletAddress = account.address;
      }
      // payload.publicKey = propertyWallet.address;
      payload.verified = false;
      payload.addedBy = identity;
      payload.ownedBy = [];
      payload.owner.forEach(owner => {
        owner.bought = false;
        payload.ownedBy.push(owner.id);
      });
      payload.status = Status.Pending;
      // let address = Object.keys(payload.address).map(i => payload.address[i]);
      // const query = contractEth.methods.editProperty(
      //   property.publicKey, 3, payload.hash, payload.value, [payload.location[0], payload.location[1]], payload.name, address)
      //   .encodeABI();
      let response = await this.database.propertyModel.findByIdAndUpdate({propertyId}, {});
      return response;
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
* API route
*  Decrypt the user wallet
* @param {IP} property
* @param {string} password
* @returns {Promise<any>}
*/
  async updatePropertyData(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    try {
      // await this.hasPermission(identity, "admin");
      let user = await this.database.passportModel.findOne({email: identity});
      let key = await this.database.sawtoothModel.findOne({email: identity}).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.sawtoothController.createAccount(user);
      } else {        // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
        privateKey = {privateKeyBytes: key.privateKey.privateKeyBytes};
        // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);Buffer.from(key.privateKey.privateKeyBytes); //
      }
      let accountCipher = await this.database.cipherModel.findOne({email: identity});
      let account;
      // if (accountCipher == null) {
      //   account = await this.web3Controller.createWallet(identity, identity);
      // } else {
      //   account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // }
      let properties = await this.database.propertyModel.find();
      let certificates = await this.database.titleCertificateModel.find();
      properties.forEach(property => {
        if (property.hash.length === 64) {
          property.hash = "c4f834".concat(property.hash);
          property.save();
        }
      });
      certificates.forEach(title => {
        if (title.hash.length === 64) {
          title.hash = "c4f834".concat(title.hash);
          title.save();
        }
      });
      return h.response();
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /*
  * API route
  *  Decrypt the user wallet
  * @param {IP} property
  * @param {string} password
  * @returns {Promise<any>}
  */
  async updateTitleData(request: any, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let page = params["page"];
    if (parseInt(page, 10) <= 0) {
      return Boom.badData("Page number should be greater than zero");
    }
    let pageSize = 10;
    let limit = parseInt(page, 10) * pageSize;
    let size = (parseInt(page, 10) - 1) * pageSize;
    try {
      // await this.hasPermission(identity, "admin");
      let user = await this.database.passportModel.findOne({email: identity});
      let key = await this.database.sawtoothModel.findOne({email: identity}).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.sawtoothController.createAccount(user);
      } else {        // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
        privateKey = {privateKeyBytes: key.privateKey.privateKeyBytes};
        // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);Buffer.from(key.privateKey.privateKeyBytes); //
      }
      let accountCipher = await this.database.cipherModel.findOne({email: identity});
      let account;
      // if (accountCipher == null) {
      //   account = await this.web3Controller.createWallet(identity, identity);
      // } else {
      //   account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // }
      let count = await this.database.titleCertificateModel.find().count();
      let certificates = await this.database.titleCertificateModel.find().limit(limit).skip(size);
      for (const title of certificates) {
        let propertyHash = title.hash;
        let property = await this.database.propertyModel.findOne({propertyId: title.propertyId});
        if (!title.propertyName) {
          title.propertyName = property.name;
        }
        // let certiticates: any[];
        for (const certificate of title.certificate) {
          console.log("Down the transaction one");
          let transaction = await this.getById(certificate.hash, "transactions");
          console.log(transaction);
          if ((certificate.hash && certificate.hash === propertyHash) || transaction === undefined || !transaction.data) {
            if (!certificate.userId || !certificate.publicKey) {
              // console.log(certificate);
              let user = await this.database.passportModel.findOne({name: certificate.name});
              // console.log(user);
              certificate.userId = user.userId;
              certificate.publicKey = user.walletAddress;
            }
            // console.log(certificate);

            setTimeout(() => console.log(certificate), 3000);
            let cert: Certificate = certificate;
            // let payload: any = cert;
            let payload = {
              id: uuid.v4(),
              action: "certificate",
              name: cert.name,
              publicKey: cert.publicKey,
              userId: cert.userId,
              propertyName: cert.propertyName,
              stake: cert.stake,
              // hash: string;
              docId: cert.docId ? cert.docId : undefined,
              url: cert.url ? cert.url : undefined,
              date: cert.date,
              contractAddress: cert.contractAddress ? cert.contractAddress : undefined,
              transactionHash: cert.transactionHash ? cert.transactionHash : undefined,
              revoke: cert.revoke ? cert.revoke : undefined,
              revoketype: cert.revoketype ? cert.revoketype : undefined,
              revokeDate: cert.revokeDate ? cert.revokeDate : undefined,
              message: cert.message ? cert.message : undefined,
            };
            // let response = await this.web3Controller.createCertificateContract(account, payload, privateKey, "certificate");
            // certificate.hash = response.hash;
            console.log(certificate);
          }
          // else if (!transaction.data) {
          //   console.log("creating trx");
          //   //Create a transaction
          // }
        }
        title.save();
      }
      return h.response(count.toString());
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  async getById(id, resourceName) {
    try {
      console.log("get" + resourceName);
      let proxy = requestExternal.get({
        url: 'http://localhost:8008/' + resourceName + '/' + id,
        json: true
      }).then(function (response) {
        // console.log(response);
        return response;
      }).catch(function (err) {
        // API call failed...
        // console.log(err);
        if (err.statusCode === 404) {
          return "error";
        }
      });
      return proxy;
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  /**
* API route
*  Confirm propertyc
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async confirmProperty(request: IRequest, h: any) {
    const identity = request.auth.credentials.id;
    let payload: any = request.payload;
    let propertyId = payload.propertyId;
    let status = payload.status;
    let createCertificate = false;
    try {
      switch (payload.status) {
        case "Approved":
          status = Status.Approved;
          createCertificate = true;
          break;
        case "Rejected":
          status = Status.Rejected;
          break;
        case "Pending":
          status = Status.Pending;
          break;
        default:
          return Boom.badData("Select valid option: Approved or Rejected");
      }
      let pending: Status = Status.Pending;
      let user = await this.database.passportModel.findOne({email: identity});
      // if (user.walletAddress.charAt(0) !== '0' || user.walletAddress.charAt(1) !== 'x') {
      //   user.walletAddress = "0x".concat(user.walletAddress);
      // }
      // var balance = await etherscanApi.account.balance(user.walletAddress);
      // if (balance.result < 1e9) {
      //   return Boom.paymentRequired(" Insufficient balance in ethereum wallet");
      // }
      let property = await this.database.propertyModel.findOne({propertyId: payload.propertyId}).
        select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id');
      if (property == null) {
        return Boom.notFound("Property not found.");
        // tslint:disable-next-line:triple-equals
      } else if (property.status != pending) {
        // console.log(" status of property is " + property.status);
        return Boom.badRequest("Property already verified, or listed");
      }
      let accountCipher = await this.database.cipherModel.findOne({email: identity});
      // let account;
      // if (accountCipher == null) {
      //   account = await this.web3Controller.createWallet(identity, identity);
      // } else {
      //   account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // }
      // if (account.address.charAt(0) !== '0' || account.address.charAt(1) !== 'x') {
      //   account.address = "0x".concat(account.address);
      // }
      if (payload.message) {
        let message = payload.message;
        property = await this.database.propertyModel.findOneAndUpdate({propertyId: propertyId},
          {status: status, message: message}, {new: true}).
          select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id');
        property.message = message;
      } else {
        property = await this.database.propertyModel.findOneAndUpdate({propertyId: propertyId},
          {status: status}, {new: true}).
          select('-_id -id -__v -updatedAt -createdAt -publicKey -owner._id');
      }
      let key = await this.database.sawtoothModel.findOne({email: identity}).select('-privateKey._id -privateKey.__v');
      // let privateKey;
      // if (key == null) {
      //   privateKey = await this.sawtoothController.createAccount(user);
      // } else {        // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
      //   privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
      //   // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);Buffer.from(key.privateKey.privateKeyBytes); //
      // }
      let certificate;
      let eCertificates = [];
      let certificateObject;
      // let trxId = uuid.v4();
      let owner = await this.database.passportModel.findOne({id: property.owner[0].id});
      if (owner == null) {
        return Boom.notFound("Owner details mismatch");
      }
      const signer = await this.sawtoothController.getSigner(owner.userId, owner.email);
      // console.log('Signer', signer);
      // console.log('Property', property);
      if (createCertificate === true) {
        let fileId = uuid.v4();
        certificateObject = certificateModel(property, owner, fileId);
        // console.log('certificateObject', certificateObject);
        // console.log('Property Id', propertyId);
        let payload: any = certificateObject;
        payload.id = uuid.v4();
        payload.action = 'certificate';
        let hash = "c4f834".concat(crypto.createHash('sha512').update(propertyId).digest('hex').toLowerCase().substring(0, 64));
        payload.propId = propertyId;
        // console.log('hash' + hash);
        // console.log('PAYLOAD ', JSON.stringify(payload));

        payload.owner = [signer.getPublicKey().asHex()];
        // certificateObject.hash = response.hash;
        let eCertificate: ECertificate = {
          certificateId: uuid.v4(),
          hash: property.hash,
          type: "Certificate",
          asset: property.hash,
          owner: signer.getPublicKey().asHex(),
          stake: 100,
          sold: false
        };
        eCertificates.push(eCertificate);
        // await addDataToDB("Certificate", eCertificate);
        // await this.sawtoothController.sendRequest(privateKey, certificateObject, trxId);
        console.log(certificateObject);
        // let { signature, signer, payloadBytes, transactionHeaderBytes } = await this.sawtoothController.createHeaderSignature(privateKey, certificateObject);
        // transaction to record
        // certificateObject.transactionHash = signature;
        let id = uuid.v4();
        payload.certificate = certificateObject.docId;
        let response = await this.web3Controller.createCertificateContract(payload, signer, "certificate");
        certificateObject.publicKey = signer.getPublicKey().asHex();
        certificateObject.hash = response;
        let TitleDoc = {
          id: id,
          propertyId: property.propertyId,
          propertyName: property.name,
          hash: property.hash,
          certificate: [certificateObject],
        };
        TitleDoc.hash = response;
        console.log('REsponse ', response);
        console.log('TItle doc hash', TitleDoc);
        certificate = await this.database.titleCertificateModel.create(TitleDoc);
        console.log('CErtificate  here', certificate);

        // await this.sawtoothController.postRequest(signature, privateKey, payloadBytes, transactionHeaderBytes);
        // let certificate = await createTemplate(templateType.certificate, certificateObject, fileId);
        /* create readable stream from buffer */
        // const stream = new Readable();
        // stream.push(certificate);
        // stream.push(null);
        // let document = await uploadDocument(stream, this.database, fileId);
      }
      // let eProperty: EProperty = {
      //   hash: property.hash,
      //   owner: [owner.walletAddress],
      //   certificates: [owner.walletAddress],
      //   contracts: [owner.walletAddress],
      //   transactions: [owner.walletAddress]
      // };
      const createProperty = {
        entity: 'Property',
        action: 'create',
        data: {
          propId: property.hash,
          type: 'property',
          prop: property.name,
          id: property.propertyId,
          owner: [signer.getPublicKey().asHex()],
          certificate: [], //eCertificates,
          contract: []
        }
      };
      // console.log('SIGNER ', signer);
      // await this.sawtoothController.sendRequestNoDb(signer.privateKey, createProperty);
      // if (status === Status.Approved) {
      //   let payload: any = property;
      //   payload.id = property.propertyId;
      //   payload.action = 'certificate';
      //   // await this.web3Controller.approveProperty(payload, identity, privateKey, trxId);
      //   // if (typeof response !== Boom){}
      //   // certificate.certificate[0].hash = response.hash;
      //   // certificate.save();
      // } else if (status === Status.Rejected) {
      //   await this.web3Controller.rejectProperty(property, identity);
      // }
      let notify = {
        id: uuid.v4(),
        UserNotification: UserNotification,
        title: "Property " + payload.name + " has been confirmed",
        message: "View property: ",
        // icon?: string;
        url: urls.user.propertyById + property.propertyId,
        event: eventType.confirm_property
      };
      // SocketComment
      // this.socketController.sendEvent(notify);
      return h.response(property).code(200);
    } catch (error) {
      console.log('Error', error);
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
  async deleteById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let id = params["propertyId"];
    try {
      let result = await this.database.propertyModel.findOneAndRemove({propertyId: id});
      let marketplaceUpdated = await this.database.marketplaceModel.findOneAndRemove({propertyId: id});
      await this.database.buyRequestModel.findOneAndRemove({propertyId: id});
      return h.response(result).code(200);
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
  async transferRequest(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let payload: any = request.payload;
      let passport = await this.database.passportModel.findOne({email: payload.email}).lean(true);
      if (!passport) {
        return Boom.notFound("User not registered.");
      }
      let res = await this.database.passportModel.update({email: payload.email}, {roleId: payload.roleId});
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
  async confirmRequest(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      await this.hasPermission(identity, "admin");
      let payload: any = request.payload;
      let passport = await this.database.passportModel.findOne({email: payload.email}).lean(true);
      if (!passport) {
        return Boom.notFound("User not registered.");
      }
      let res = await this.database.passportModel.update({email: payload.email}, {roleId: payload.roleId});
      return h.response(res).code(200);
    } catch (error) {
      return h.response(error).code(501);
    }
  }
  /**
  * Check the user has permissions or not
  * @param {string} identity
  * @param {string} roleId
  * @returns {string}
  */
  async hasPermission(identity: string, roleId: string) {
    let adminPassport = await this.database.passportModel.findOne({email: identity});
    if (!adminPassport && adminPassport.roleId === roleId) {
      return Boom.unauthorized("User not authorised to perform action.");
    }
    return true;
  }

}