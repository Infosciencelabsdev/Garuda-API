import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from "../interfaces/request";
import { transactionType, scope, Receipt } from "./trx";
import { roles } from "../user/user";
import { web3, web3TestNet } from "../web3/web3";

export default class TransactionController {

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
  /**
* API route
*  Get all transaction of the user
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getAllTransaction(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let user = await this.database.passportModel.findOne({ email: identity });
      let params = request.params;
      let page = params["page"];
      if (parseInt(page, 10) <= 0) {
        return Boom.badData("Page number should be greater than zero");
      }
      let pageSize = 10;
      let limit = parseInt(page, 10) * pageSize;
      let size = (parseInt(page, 10) - 1) * pageSize;
      if (user.role === roles.admin || user.roleId === 'admin') {
        console.log(" user role admin ");
        let res = await this.database.transactionModel.find().sort({ createdAt: 'desc' }).limit(limit).skip(size);
        let count = await this.database.transactionModel.count({});
        let response = { data: res, lastPage: { index: count, page: Math.ceil(count / 10) } };
        return h.response(response).code(200);
      } else if (user.role === roles.government) {
        let res = await this.database.transactionModel.find({ scope: scope.government }).sort({ createdAt: 'desc' }).limit(limit).skip(size);
        let count = await this.database.transactionModel.find({ scope: scope.government }).count({});
        let response = { data: res, lastPage: { index: count, page: Math.ceil(count / 10) } };
        return h.response(response).code(200);
      } else {
        let res = await this.database.transactionModel.find({ $or: [{ address: user.walletAddress }, { sender: user.walletAddress }] }).sort({ createdAt: 'desc' }).limit(limit).skip(size);
        let count = await this.database.transactionModel.find({ $or: [{ address: user.walletAddress }, { sender: user.walletAddress }] }).count({});
        let response = { data: res, lastPage: { index: count, page: Math.ceil(count / 10) } };
        return h.response(response).code(200);
      }

    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
  * API route
  *  Get by id transaction (User Scope)
  * @param {IRequest} request
  * @param {ResponseToolkit} h
  * @returns {Promise<any>}
  */
  async getTransactionById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      // let user = await this.database.passportModel.findOne({ email: identity });
      let params = request.params;
      let id = params["id"];
      let transaction = await this.database.transactionModel.findOne({ $or: [{ transactionId: id }, { id: id }] });
      // transaction.public.receipt: Receipt;
      // console.log(transaction.public.receipt.gasUsed);
      // if (transaction.public.receipt.gasUsed != null || transaction.public.receipt.gasUsed === undefined) {
      //   console.log("if ");
      //   let gas = transaction.public.receipt.gasUsed;
      //   transaction.public.receipt.gasUsed = await web3TestNet.utils.toDecimal(gas);
      //   console.log(transaction.public.receipt.gasUsed);
      // }
      return h.response(transaction).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  //   /**
  // * API route
  // *  Create a transaction (Abstract) --> In web3.ts
  // * @param {IRequest} request
  // * @param {ResponseToolkit} h
  // * @returns {Promise<any>}
  // */
  //   async createTransaction(identity, trxId, trxObject) {
  //     try {
  //       let user = await this.database.passportModel.findOne({ email: identity });
  //       let Transaction = {
  //         transactionId: trxId,
  //         transactionType: transactionType,
  //         userId: trxObject.userId,
  //         transaction: trxObject.NetworkTransaction,
  //         status: trxObject.transactionStatus,
  //         scope: trxObject.scope ? trxObject.scope : scope.personal,
  //       };
  //       let transaction = await this.database.transactionModel.create(Transaction);
  //       return transaction;
  //     } catch (error) {
  //       return Boom.badRequest(error);
  //     }
  //   }

}