import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from "../interfaces/request";
import * as Hapi from 'hapi';
import * as Boom from 'boom';

export default class CertificateController {
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
*  Get certificate for property
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getPropertyCertificateById(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let id = params["propertyId"];
    try {
      let certificate = await this.database.titleCertificateModel.findOne({ propertyId: id })
        .select('-id -_id -certificate._id -__v -updatedAt -createdAt');
      // let result = await this.database.titleCertificateModel.findOne({ propertyId: id });
      // populate('docs_ts')
      if (certificate == null) {
        return Boom.notFound("certificate not available.");
      }
      // console.log(result);
      // let document = await this.database.documentModel.findOne({ id: result.certificate[0].docId });
      // let response = {
      //   metadata: result,
      //   url: document
      // };
      // console.log(" Document is s")

      return h.response(certificate).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Get current title contract for property
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
async getTitleContractById(request: IRequest, h: Hapi.ResponseToolkit) {
  const identity = request.auth.credentials.id;
  let params = request.params;
  let id = params["propertyId"];
  try {
    let contract = await this.database.contractModel.find({ propertyId: id }) //, title: true
      .select('-id -_id -buyer._id -__v -seller._id -price._id -updatedAt -createdAt');
    if (!contract || contract == null) {
      return Boom.notFound("Contract not available.");
    }
    return h.response(contract).code(200);
  } catch (error) {
    return Boom.badRequest(error);
  }
}
async getAllContracts(request: IRequest, h: Hapi.ResponseToolkit) {
  const identity = request.auth.credentials.id;
  let params = request.params;
  let id = params["propertyId"];
  try {
    // await
    let contract = await this.database.contractModel.find()
      .select('-id -_id -buyer._id -__v -seller._id -price._id -updatedAt -createdAt');
    if (!contract || contract == null) {
      return Boom.notFound("Contract not available.");
    }
    return h.response(contract).code(200);
  } catch (error) {
    return Boom.badRequest(error);
  }
}
  /**
* API route
*  Get current title contract for property
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
async getSoldContractById(request: IRequest, h: Hapi.ResponseToolkit) {
  const identity = request.auth.credentials.id;
  let params = request.params;
  let id = params["propertyId"];
  try {
    let contract = await this.database.contractModel.find({ propertyId: id, title: false })
      .select('-id -_id -buyer._id -__v -seller._id -price._id -updatedAt -createdAt');
    if (!contract) {
      return Boom.notFound("Contract not available.");
    }
    return h.response(contract).code(200);
  } catch (error) {
    return Boom.badRequest(error);
  }
}
  /**
* API route
*  Get certificate for property
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
async getContractByUser(request: IRequest, h: Hapi.ResponseToolkit) {
  const identity = request.auth.credentials.id;
  let params = request.params;
  let id = params["userId"];
  try {
    let user = await this.database.passportModel.findOne({ email: identity});
    let contract = await this.database.contractModel.find({ 'seller.address': user.walletAddress })
      .select('-id -_id -buyer._id -__v -seller._id -price._id -updatedAt -createdAt');
    if (contract == null) {
      return Boom.notFound("contract not available.");
    }
    return h.response(contract).code(200);
  } catch (error) {
    return Boom.badRequest(error);
  }
}
//user - buy and sold properties table/collection
  /**
* API route
*  Get certificate for property
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async verifyCertificate(request: IRequest, h: Hapi.ResponseToolkit) {
    const identity = request.auth.credentials.id;
    let params = request.params;
    let id = params["propertyId"];
    try {
      let result = await this.database.titleCertificateModel.findOne({ propertyId: id });



      return h.response(result).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
    /**
* API route
*  Get certificate for property
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
async verifyContract(request: IRequest, h: Hapi.ResponseToolkit) {
  const identity = request.auth.credentials.id;
  let params = request.params;
  let id = params["propertyId"];
  try {
    let result = await this.database.titleCertificateModel.findOne({ propertyId: id });



    return h.response(result).code(200);
  } catch (error) {
    return Boom.badRequest(error);
  }
}
}