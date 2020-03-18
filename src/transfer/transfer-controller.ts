import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from "../interfaces/request";
import uuid = require("uuid");
import web3Class from "../web3/web3-controller";

import { createTemplate, templateType } from "../templates/tamplate";
import { buyContractModel, ContractModel } from "../templates/models";
import { ListingStatus } from "./transfer";
import { Status } from "../assets/asset";
import { certificateModel, revokeType, TitleCertificateModel } from "../certificates/certificate";
import SawtoothController from "../saw-client/sawtooth-controller";
import { etherscanApi } from "../wallet/wallet-controller";
import { roles, IPassport } from "../user/user";
import { UserNotification, urls, eventType } from "../notification/push";
import SocketController from "../socket/socket-controller";
import { r, addDataToDB } from "../database/rethink";
import { ECertificate } from "../explorer/explorer";
export default class Controller {
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
*  Request / bid for buy
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async buyRentRequest(request: IRequest, h: Hapi.ResponseToolkit) {
    console.log('Some Request');
    const identity = request.auth.credentials.id;
    let payload: any = request.payload;
    try {
      // let accountCipher = await this.database.cipherModel.findOne({ email: identity });
      // let account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // var balance = await etherscanApi.account.balance(account.address);
      // if (account.address.charAt(0) !== '0' || account.address.charAt(1) !== 'x') {
      //   account.address = "0x".concat(account.address);
      // }
      // if (balance < 1e9) {
      //   return Boom.paymentRequired(" Insufficient balance in ethereum wallet");
      // }
      // let t0 = performance.now();
      let buyer = await this.database.passportModel.findOne({ email: identity }).select('+userId');
      let marketProperty = await this.database.marketplaceModel.findOne({ propertyId: payload.propertyId });
      let property = await this.database.propertyModel.findOne({ propertyId: payload.propertyId });
      let propertyBids = await this.database.buyRequestModel.find({ propertyId: payload.propertyId, isActive: true });
      let contract = await this.database.contractModel.findOne({ propertyId: payload.propertyId });
      if (marketProperty == null) {
        return Boom.badRequest("Property not listed for sale");
      }
      let seller = await this.database.passportModel.findOne({ id: property.ownedBy[0].toString() }).select('+userId');
      property.owner.forEach(async (owner) => {
        if (owner.title) {
          seller = await this.database.passportModel.findOne({ id: owner.id }).select('+userId');
        } else if (owner.bought && !owner.sold) {
          seller = await this.database.passportModel.findOne({ id: owner.id }).select('+userId');
        }
      });
      if (seller == null) {
        return Boom.notFound("seller detail mismatch");
      }
      // if (!buyer.address.street || !seller.address.street) {
      //   return Boom.badRequest("User address not saved");
      // }
      let key = await this.database.sawtoothModel.findOne({ email: identity }).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.sawtoothController.createAccount(buyer);
      } else {        // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
        privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
        // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);Buffer.from(key.privateKey.privateKeyBytes); //
      }
      let tax = (payload.percent * marketProperty.value) / 100;
      let request: any = {
        id: uuid.v4(),
        propertyId: property.propertyId,
        value: marketProperty.value,
        marketplaceId: property.propertyId,
        percent: payload.percent,
        tax: tax,
        amount: (marketProperty.value + tax),
        seller: [seller.id],
        buyer: [buyer.id],
        // contractHash: string, // verify, view optional
        // titleDoc: string, // verify, view
        notary: false,
        stampDuty: false,
        registered: false,
        // titleId: "ssds-sds-sdsxzx",
        status: ListingStatus.Requested
      };
      propertyBids.forEach(propertyBid => {
        if (propertyBid.isActive && propertyBid.status !== ListingStatus.Completed) {
          return Boom.badRequest("Property already in for sale");
        }
        if (propertyBid.isActive) {
          propertyBid.isActive = false;
          propertyBid.save();
        }
      });

      console.log('BUy REquest ', request);
      let propertyRequest = await this.database.buyRequestModel.create(request);
      // let response = await this.database.buyRequestModel.create(request);
      // let fileId = uuid.v4();
      // let res = await this.database.marketplaceModel.update({ email: payload.email }, { roleId: payload.roleId });

      let contractPayload = await buyContractModel(property, marketProperty, buyer, seller, request);
      // let EthRequest = {
      //   propId: property.propId,
      //   buyerAddress: account.address
      // };
      contractPayload.id = uuid.v4();
      contractPayload.action = 'contract';
      // TO DOs
      // let response = await this.web3Controller.buyRequest(account, EthRequest, identity, contractPayload, privateKey);
      // contractPayload.hash = response.hash;
      contractPayload.hash = undefined;

      contract = await new ContractModel(contractPayload).save();
      console.log('COntract Payload', contractPayload);
      let UserNotification = new Array<UserNotification>();
      let government = await this.database.passportModel.find({ role: roles.government });
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
          title: "A buy request is made for the property " + property.name,
          message: "Confirm buy request: ",
          // icon?: string;
          url: urls.government.transferById + payload.propertyId + "/" + request.id,
          event: eventType.buy_property
        };
        this.socketController.sendEvent(notify);
      }
      let notify = {
        id: uuid.v4(),
        UserNotification: [{
          userId: seller.userId,
          email: seller.email,
          read: false
        }],
        title: "A buy request is made for your property " + property.name,
        message: "Awaiting Government confirmation.",
        // icon?: string;
        url: urls.user.listingById + payload.propertyId,
        event: eventType.buy_property
      };
      this.socketController.sendEvent(notify);
      // if (contract == null) {
      //   contract = await new ContractModel(contractPayload).save();
      // }
      // transaction to store contract params, hash and fileId
      // let contract = await createTemplate(templateType.landTransfer, contractPayload, fileId);
      return h.response(propertyRequest).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  /**
  * API route
  *  Get all the buy request for all properties (government scope)
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async getAllRequest(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let params = request.params;
      let page = params["page"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      // await this.hasPermission(identity, "government");
      let requests = await this.database.buyRequestModel.find().sort({ createdAt: 'desc' }).limit(limit).skip(size);
      return h.response(requests).code(200);
    } catch (error) {
      return h.response(error).code(501);
    }
  }
  /**
* API route
*  Get all the buy request for all properties (government scope)
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async addAllProeprtyName(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      // await this.hasPermission(identity, "government");
      let requests = await this.database.buyRequestModel.find();
      for (const request of requests) {
        let property = await this.database.propertyModel.findOne({ propertyId: request.propertyId }).select("name");
        request.propertyName = property.name;
        request.save();
      }
      return h.response(requests).code(200);
    } catch (error) {
      return h.response(error).code(501);
    }
  }
  /**
  * API route
  *  Get all the buy request for single property  (government and owner scope)
  * ToDo: in 1.0
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  /**
  * API route
  *  Get all the buy request for all properties (government scope)
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async getRequestById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let id = params["id"];
    try {
      // await this.hasPermission(identity, "government");
      let res = await this.database.buyRequestModel.findOne({ id: id });
      return h.response(res).code(200);
    } catch (error) {
      return h.response(error).code(501);
    }
  }
  /**
  * API route
  *  Confirm the buy request (government only)
  * ToDo: in 1.0 multiple request // only owner and then govt.
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async confirmRequest(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let id = params["id"];
    try {
      await this.hasPermission(identity, "government");
      let user = await this.database.passportModel.findOne({ email: identity });
      let accountCipher = await this.database.cipherModel.findOne({ email: identity });
      // let account = await this.web3Controller.decryptWallet(accountCipher, accountCipher.email);
      // if (account.address.charAt(0) !== '0' || account.address.charAt(1) !== 'x') {
      //   account.address = "0x".concat(account.address);
      // }
      // var balance = await etherscanApi.account.balance(account.address);
      // if (balance < 1e9) {
      //   return Boom.paymentRequired("Insufficient balance in ethereum wallet");
      // }
      let bidRequest = await this.database.buyRequestModel.findOne({ id: id });
      console.log('Bid Request', bidRequest);
      if (bidRequest.status === ListingStatus.Completed) {
        return Boom.badRequest("Request already confirmed");
      } else if (bidRequest.status === ListingStatus.Rejected) {
        return Boom.badRequest("Request has been rejected");
      }
      // let key = await this.database.sawtoothModel.findOne({ email: identity }).select('-privateKey._id -privateKey.__v');
      // // let privateKey;
      // // if (key == null) {
      // //   privateKey = await this.sawtoothController.createAccount(user);
      // // } else {        // await this.sawtoothController.sendRequest(privateKey, payload, trxId);
      // //   privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
      // //   // await this.sawtoothController.sendRequest(privateKey1, payload, trxId);Buffer.from(key.privateKey.privateKeyBytes); //
      // // }
      let property = await this.database.propertyModel.findOne({ id: bidRequest.propertyId });
      let marketplace = await this.database.marketplaceModel.findOne({ propertyId: bidRequest.propertyId });
      if (marketplace == null || property == null || bidRequest == null) {
        return Boom.badData(" Unable to process request");
      }
      let buyers = new Array<IPassport>();
      let sellers = new Array<IPassport>();
      for (let index = 0; index < bidRequest.buyer.length; index++) {
        const iterator = bidRequest.buyer[index];
        let buyer = await this.database.passportModel.findOne({ id: iterator }).select('+userId');
        buyers.push(buyer);
      }
      for (let index = 0; index < bidRequest.seller.length; index++) {
        const iterator = bidRequest.buyer[index];
        let seller = await this.database.passportModel.findOne({ id: iterator }).select('+userId');
        sellers.push(seller);
      }
      if (params.status === "Rejected") {
        console.log('The Transfer Request is rejected');
        bidRequest.status = ListingStatus.Rejected;
        bidRequest.save();
        await this.database.contractModel.findOneAndRemove({ id: bidRequest.id });
        return h.response({ property, marketplace }).code(200);
      } else {
        for (const owner of property.owner) {
          owner.sold = true;
          owner.sellDate = new Date();
          owner.title = false;
        }
        let titleCertificate = await this.database.titleCertificateModel.findOne({ propertyId: bidRequest.propertyId });
        console.log('Title Certificate Response ', titleCertificate);
        if (titleCertificate != null) {
          titleCertificate.certificate.forEach(certificate => {
            if (!certificate.revoke) {
              certificate.revoke = true;
              certificate.revoketype = revokeType.Sell;
              certificate.revokeDate = new Date();
            }
          });
        } else {
          let titleDoc = {
            id: uuid.v4(),
            propertyId: property.propertyId,
            propertyName: property.name,
            certificate: [],
          };
          // titleDoc.certificate.push(titleDoc.id);
          titleCertificate = await new TitleCertificateModel(titleDoc).save();
        }
        let newCertificates = [];
        let signers = [];
        let sellers = [];
        if (bidRequest.buyer == null) {
          return Boom.badImplementation("Bad buy request, unable to find buyer details");
        } else {
          property.ownedBy = [];
          marketplace.ownedBy = [];
          for (let index = 0; index < bidRequest.buyer.length; index++) {
            const iterator = bidRequest.buyer[index];
            let buyer = await this.database.passportModel.findOne({ id: iterator }).select('+userId');
            const signer = await this.sawtoothController.getSigner(buyer.userId, buyer.email);
            // console.log('Signers :', signer);
            signers.push(signer.getPublicKey().asHex());

            const sellerid = bidRequest.seller[0];
            let seller = await this.database.passportModel.findOne({ id: sellerid }).select('+userId');
            const sellerIds = await this.sawtoothController.getSigner(seller.userId, seller.email);
            // console.log('Signers :', signer);
            sellers.push(sellerIds.getPublicKey().asHex());

            let fileId = uuid.v4();
            let certificateObject = certificateModel(property, buyer, fileId);
            let contract = await this.database.contractModel.findOne({ propertyId: bidRequest.propertyId });
            // console.log('COntract ', contract);
            let payload: any = certificateObject;
            payload.id = uuid.v4();
            payload.action = 'certificate';
            payload.contract = bidRequest.id;
            payload.propId = bidRequest.propertyId;
            payload.buyer = signers;
            payload.seller = sellers;
            payload.certificate = certificateObject.docId;

            // console.log('TRansfer Payload', payload);
            let response = await this.web3Controller.createCertificateContract(payload, signer, "contract");
            certificateObject.hash = response;
            certificateObject.publicKey  = signer.getPublicKey().asHex();
            console.log('certificate Object', certificateObject);
            // newCertificates.push(response.hash);
            titleCertificate.certificate.push(certificateObject);
            let id = uuid.v4();
            let eCertificate: ECertificate = {
              certificateId: id,
              hash: response,
              type: "Certificate",
              asset: property.hash,
              owner: signer.getPublicKey().asHex(),
              stake: 100,
              sold: false
            };
            await addDataToDB("Certificate", eCertificate);
            newCertificates.push(id);
            property.ownedBy.push(buyer.id);
            marketplace.ownedBy.push(buyer.id);
            let owner = {
              id: buyer.id,
              stake: 100,
              type: 'individual',
              buyDate: new Date(),
              bought: true,
              verified: true,
              title: true,
              sold: false,
              docs: [""]
            };
            property.owner.push(owner);

          }
        }
        //   r.table('Property')
        //   .pluck({ hash: property.hash }).run()
        //   .then(results => {
        //     results.previousCertificates = results.certificates;
        //     results.certificates.forEach( hash => {
        //       r.table('Certificate')
        //       .pluck({ hash: hash}).run().then(certificate => {
        //         certificate.sold = true;
        //       });
        //     });
        //     results.certificates = newCertificates;
        //     // results.transactions.push(response.hash);
        //     return r.table('Property').update(results).run();
        //   });
        // r.table('User')
        //   .pluck({ hash: signers[0] }).run()
        //   .then(results => {
        //     results.assets.push(property.hash);
        //     results.certificates.push(newCertificates);
        //     // results.transactions.push(response.hash);
        //     return r.table('User').update(results).run();
        // });
        property.status = Status.Approved;
        property.save();
        marketplace.status = Status.Approved;
        marketplace.isActive = false;
        marketplace.save();
        // let propertyUpdated = await this.database.propertyModel.update({ id: bidRequest.propertyId }, property, { new: true });
        // let marketplaceUpdated = await this.database.marketplaceModel.update({ id: bidRequest.marketplaceId }, marketplace, { new: true });
        // await this.database.marketplaceModel.findOneAndRemove({ id: bidRequest.marketplaceId });
        // let marketplaceHistory = await this.database.marketplaceHistoryModel.create(marketplace);
        bidRequest.status = ListingStatus.Completed;
        bidRequest.save();
        await this.database.contractModel.findOneAndUpdate({ id: { $ne: bidRequest.id }, propertyId: bidRequest.propertyId, title: true },
          {
            sold: true,
            title: false
          }, { new: true });
        let account: any = {};
        account.address = 'any';
        await this.database.contractModel.findOneAndUpdate({ id: bidRequest.id },
          {
            notary: true,
            stampDuty: true,
            registered: true,
            verified: true,
            title: true,
            sold: false,
            verifiedBy: account.address
          }, { new: true });
        titleCertificate.save();
        // await this.web3Controller.approveChangeOwnership(account, property, identity);
      }
      // let contract = await createTemplate(templateType.landTransfer, contractPayload, fileId);
      let BuyerNotification = new Array<UserNotification>();
      buyers.forEach(buyer => {
        let userNotification = {
          userId: buyer.userId,
          email: buyer.email,
          read: false
        };
        BuyerNotification.push(userNotification);
      });
      let SellerNotification = new Array<UserNotification>();
      sellers.forEach(seller => {
        let userNotification = {
          userId: seller.userId,
          email: seller.email,
          read: false
        };
        SellerNotification.push(userNotification);
      });
      let notify = {
        id: uuid.v4(),
        UserNotification: BuyerNotification,
        title: params.status === "Approved" ? "Buy request has been successful " + property.name : "Buy request for " + property.name + "is rejected",
        message: params.status === "Approved" ? "Confirmed by government." : params.message,
        // icon?: string;
        url: urls.user.propertyById + property.propertyId,
        event: eventType.confirm_buy
      };
      this.socketController.sendEvent(notify);
      let sellerNotify = {
        id: uuid.v4(),
        UserNotification: SellerNotification,
        title: params.status === "Approved" ? property.name + " is sold." : "Buy request for " + property.name + "is rejected",
        message: params.status === "Approved" ? "Confirmed by government." : params.message,
        // icon?: string;
        url: urls.user.soldPropertyById, // + property.propertyId,
        event: eventType.confirm_buy
      };
      this.socketController.sendEvent(sellerNotify);
      return h.response({ property, marketplace }).code(200);
    } catch (error) {
      return Boom.boomify(error);
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
      return Boom.unauthorized("Not authorised to perform action.");
    }
    return true;
  }
}