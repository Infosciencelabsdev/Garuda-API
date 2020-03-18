import * as Boom from "boom";
import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IServerConfigurations, getWeb3Config, Web3Configuration } from "../configurations";
import { LoggerInstance } from 'winston';
import SawtoothController from "../saw-client/sawtooth-controller";

export default class Web3Controller {
  // socketController = new SocketController(this.server, this.configs, this.database, this.logger);
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
*  compile contract and create abi
* @param {IP} property
* @param {string} password
* @returns {Promise<any>}
*/

  async createProperty(payload, privateKey, owners) {
    const createProperty = {
      entity: 'Property',
      action: 'create',
      data: {
        propId: payload.hash,
        type: 'property',
        prop: payload.name,
        id: payload.propertyId,
        owner: owners,
        certificate: [], //eCertificates,
        contract: [],
        timeStamp: new Date()
      }
    };
    console.log("Initiate");
    let result = await this.sawtoothController.sendRequest(privateKey, createProperty);

    console.log("finish");
    return result;
  }

  async createCertificateContract(payload, privateKey, type, TitleDoc?) {
    console.log('Payload ', payload);
    let certPayload = {
      entity: 'Certificate',
      action: 'create',
      data: payload   };
      if ( type === 'contract') {
        certPayload.entity = 'contract';
        // certPayload.data.certificate = payload.id;
      }
      console.log('Cert Payload', certPayload);
    let result = await this.sawtoothController.sendRequest(privateKey, certPayload, TitleDoc);
    return result;
    // } catch (error) {
    //   return Boom.badImplementation(error);
    // }
  }
}
