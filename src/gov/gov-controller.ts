import * as Hapi from "hapi";
import * as Boom from "boom";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from '../interfaces/request';
import Web3Controller from "../web3/web3-controller";
import { Tax } from "./gov";
import { ICipher } from "../wallet/wallet";
import { IPassport } from "../user/user";
import uuid = require("uuid");

export default class GovController {

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
*  Get all the properties
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async createTax(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let payload = request.payload;
      let percent = payload["percent"];
      let propertyType = payload["propertyType"] ? payload["propertyType"] : "Others";
      let tax = await this.database.taxModel.findOne({ propertyType: propertyType });
      // if (tax) {
      //   let response = await this.database.taxModel.findOneAndUpdate({ propertyType: propertyType }, { percent: percent }, { upsert: true });
      //   return h.response(response).code(200);
      // }
      // let taxId = uuid.v4();
      let TaxDoc = {
        taxId: uuid.v4(),
        percent: percent,
        propertyType: propertyType,
      };
      let response = await this.database.taxModel.create(TaxDoc);
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Get all the properties
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async editTax(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let payload = request.payload;
      let params = request.params;
      let percent = payload["percent"];
      let propertyType = params["type"] ? params["type"] : "Others";
      let tax = await this.database.taxModel.findOne({ propertyType: propertyType });
      if (!tax) {
        return Boom.notFound(" Type not availabel");
      }
      let response = await this.database.taxModel.findOneAndUpdate({ propertyType: propertyType }, { percent: percent }, { upsert: true, new: true });
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Get all the properties
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getPropertyTax(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let params = request.params;
      let response = await this.database.taxModel.find().select('-_id taxId percent propertyType');
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Get all the properties
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getPropertyTaxByType(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let params = request.params;
      let propertyType = params["type"] ? params["type"] : "Others";
      let response = await this.database.taxModel.findOne({ propertyType: propertyType }).select('-_id taxId percent propertyType');
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
* API route
*  Get all the properties
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getPropertyTaxById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    try {
      let params = request.params;
      let id = params["id"];
      let response = await this.database.taxModel.findOne({ taxId: id });
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
}