import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { IRequest } from "../interfaces/request";
import * as Hapi from 'hapi';
import * as Boom from 'boom';
import * as requestExternal from 'request-promise-native';
// import * as requestType from 'request';
import SawtoothController from "../saw-client/sawtooth-controller";
import * as WebSocket from 'ws';
import { getPropertyData, getUserData, getPropertyDetails } from "../saw-client/lib";
import { getHashDetails, hashIdList } from "../database/rethink";
import { getType } from "mime";
// import request = require("request");
// import { response } from "express";
// const WebSocketAwait = require('ws-await');

// var WebSocketClient = new Web;

// let ws = new WebSocketClient('ws:localhost:8008/subscriptions');
// let _ws: any;

export default class ExplorerController {
  sawtoothController = new SawtoothController(this.configs, this.database, this.logger);
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
    // ws.onopen = () => {
    //   _ws = ws;
    //   ws.send(JSON.stringify({
    //     'action': 'subscribe',
    //     'address_prefixes': ['c4f834']
    //   }));
    //   ws.on('message', async function (message) {
    //     console.log("Message " + message);
    //     if (message.type === 'utf8') {
    //       // await this.database.sa
    //       console.log("Received: '" + message.utf8Data + "'");
    //     }
    //   });
    // };
  }
  /**
* API route
*  Search for hash
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async search(request: IRequest, h: Hapi.ResponseToolkit) {
    let identity = 'admin@garuda.com'; //request.auth.credentials.id;
    let params = request.params;
    let keyword = params["keyword"];
    try {
      let user = await this.database.passportModel.findOne({ email: identity });
      let key = await this.database.sawtoothModel.findOne({ email: identity }).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.sawtoothController.createAccount(user);
      } else {
        privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
      }
      let response = {
        type: "transactions",
        id: keyword
      };
      if (keyword.length === 64) {
        keyword = "c4f834".concat(keyword);
        response.type = "state";
        response.id = keyword;
        //asset hash without prefix
      } else if (keyword.length === 70) {
        let state = await this.getById(keyword, "state");
        if (state.data) {
          response.type = "state";
        } else {
          return Boom.badData("Invalid state hash.");
        }
        //asset hash with prefix
      } else if (keyword.length === 128) {
        // differentiate blocks,batches,and trx
        let transaction = await this.getById(keyword, "transactions");
        if (transaction.data) {
          response.type = "transactions";
        } else {
          let block = await this.getById(keyword, "blocks");
          if (block.data) {
            response.type = "blocks";
          } else {
            let batch = await this.getById(keyword, "batches");
            if (batch.data) {
              response.type = "batches";
            } else {
              return Boom.badData("Invalid string search");
            }
          }
        }
      } else {
        return Boom.badData("Invalid string search");
      }
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  /**
* API route
*  Search for hash
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async onSocket(request: IRequest, h: Hapi.ResponseToolkit) {
    let identity = 'admin@garuda.com'; //request.auth.credentials.id;
    let params = request.params;
    let keyword = params["keyword"];
    try {
      let user = await this.database.passportModel.findOne({ email: identity });
      let key = await this.database.sawtoothModel.findOne({ email: identity }).select('-privateKey._id -privateKey.__v');
      let privateKey;
      if (key == null) {
        privateKey = await this.sawtoothController.createAccount(user);
      } else {
        privateKey = { privateKeyBytes: key.privateKey.privateKeyBytes };
      }
      let response = await this.sawtoothController.getRequest(privateKey, keyword);
      // response.url
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  /**
* API route
*  Search for hash
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getStateChanges(request: IRequest, h: Hapi.ResponseToolkit) {
    // let identity = 'admin@garuda.com'; //request.auth.credentials.id;
    let params = request.params;
    let address = params["address"];
    let block_id = params["head"];
    let currentState;
    let state = [];
    let stateChanges = [];
    try {

      let ws = new WebSocket('ws:localhost:8008/subscriptions');

      ws.onopen = () => {
        ws.send(JSON.stringify({
          'action': 'subscribe',
          'address_prefixes': [address]
        }));
      };
      ws.onmessage = (message) => {
        currentState = message;
        state.push(message);
        console.log(message);
        if (message.data.state_changes && message.data.state_changes.length) {
          stateChanges.push(message);
        }
      };
      while (currentState.data.block_num > 0) {
        console.log("current state");
        let previous_block_id = currentState.data.previous_block_id;
        ws.send(JSON.stringify({
          'action': 'get_block_deltas',
          'block_id': previous_block_id,
          'address_prefixes': [address]
        }));
        ws.onmessage = (message) => {
          currentState = message;
          state.push(message);
          if (message.data.state_changes && message.data.state_changes.length) {
            stateChanges.push(message);
          }
        };
      }
      return h.response(currentState).code(200);
    } catch (error) {
      return Boom.badRequest(error);
    }
  }
  async getById(id, resourceName) {
    try {
      let proxy = requestExternal.get({
        url: 'http://localhost:8008/' + resourceName + '/' + id,
        json: true
      }).then(function (response) {
        return response;
      }).catch(function (err) {
        // API call failed...
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
*  Get list of states
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getAll(request: IRequest, h: Hapi.ResponseToolkit) {
    let params = request.params;
    try {
      return h.response().code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  /**
* API route
*  Get states by id
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getStateById(request: IRequest, h: Hapi.ResponseToolkit) {
    let params = request.params;
    try {
      return h.response().code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  /**
* API route
*  Get states by id
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async getResourceList(request: IRequest, h: Hapi.ResponseToolkit) {
    let params = request.params;
    let resource = params.resource;
    let page = parseInt(params['page'], 10);
    let limit = page * 10;
    let skip = (page - 1) * 10;
    // let start = params.start;
    // let head = params.head;
    try {
      let response = await this.database.propertyModel.find().limit(limit).skip(skip);
      // let r1 = await this.database.propertyModel.aggregate(
      //   {
      //     $lookup: {
      //       from: "owners",
      //       localField: "",
      //       foreignField: "",
      //       as: "owners"
      //     }
      //   },
      //   {
      //     $unwind: "$owners"
      //   },
      // );
      // console.log(r1);
      return h.response(response).code(200);
    } catch (error) {
      return Boom.boomify(error);
    }
  }
  async getUserDetails(request?: any) {
    if (request.params.id) {
      let propDetails = await getPropertyData(request.params.id);
      return { data: propDetails };
    }
    let userIds = await getUserData();
    return { data: userIds };
  }

  async getPropDetails(request?: any) {
    if (request.params.id) {
      let propDetails = await getPropertyData(request.query.id);
      return (propDetails);
    }
    let propNames = await getPropertyDetails();
    return { data: propNames };
  }

  async getCertDetails(request?: any) {
    if (request.params.id) {
      let certDetails = await getHashDetails({ certificate: request.query.id });
      return certDetails;
    }
    let certNames = await hashIdList('Certificate');
    console.log('Certnames', certNames);
    return { data: certNames };
  }

  async getContractDetails(request?: any) {
    if (request.params.id) {
      let contractDetails = await getHashDetails({ contract: request.query.id });
      return { data: contractDetails };
    }
    let contractNames = await hashIdList('Contract');
    return { data: contractNames };
  }

  async getTxnDetails(request: any) {
    if (request.params.id) {
      let txnDetails = await getHashDetails({ transactionId: request.query.id });
      return { data: txnDetails };
    }
    let contractNames = await hashIdList('Transaction');
    return { data: contractNames };
  }

  async getSearchDetails(request?: any) {
    let getDetails = await getType(request.params.id);
    switch (getDetails) {
      case 'user':
        this.getUserDetails(request);
        break;
      case 'certificate':
        this.getCertDetails(request);
        break;
      case 'property':
        this.getPropDetails(request);
        break;
      case 'contract':
        this.getContractDetails(request);
        break;
      default:
        this.getTxnDetails(request);
        break;
    }
    return { data: getDetails };
  }

}
