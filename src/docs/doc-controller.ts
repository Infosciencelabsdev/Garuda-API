import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import * as Boom from 'boom';
import { IRequest } from '../interfaces/request';
import * as Loki from 'lokijs';
import * as fs from 'fs';
import * as path from 'path';
import { uploader, loadCollection } from './doc';
import * as multer from 'multer';
import { publicEncrypt } from "crypto";
import uuid = require("uuid");
const IPFS = require('ipfs-http-client');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

const AWS = require('aws-sdk');

const DB_NAME = 'docs.json';
export const COLLECTION_NAME = 'documents';
export const UPLOAD_PATH = 'uploads/documents';
const proupload = multer({ dest: `${UPLOAD_PATH}/` }); // multer configuration
const db = new Loki(`${DB_NAME}`,
  {
    persistenceMethod: 'fs',
    autosave: true, autoload: false, autosaveInterval: 4000
  });
export const FileOptions = { dest: `${UPLOAD_PATH}/` };

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH);
}
/**
* API route: create a new cargo
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
export async function uploadDocument(file, database, fileId): Promise<any> {
  try {
    const fileDetails = await uploader(file, FileOptions, database);
    const col = await loadCollection(COLLECTION_NAME, db);
    const result = col.insert(fileDetails);
    db.saveDatabase();

    let fileStream = fs.readFileSync(path.join(UPLOAD_PATH, result.filename));
    let results = await ipfs.add(fileStream);
    let url = `https://ipfs.io/ipfs/${results[0].hash}`;
    // To Do Encrypt the doc and store private key
    let imageDoc = { id: fileId, filename: result.filename, type: result.mimetype, hash: result.hash, data: url };
    // this.database.documentModel.cre
    await database.documentModel.create(imageDoc);
    // let response = { id: result.fileName, url: url, hash: result.hash };
    return imageDoc;
  } catch (error) {
    return Boom.boomify(error);
  }
}
/**
* API route: create a new cargo
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
export async function verifyDocument(file, database, hash): Promise<any> {
  try {
    const fileDetails = await uploader(file, FileOptions, database);
    const col = await loadCollection(COLLECTION_NAME, db);
    const result = col.insert(fileDetails);
    let fileStream = fs.readFileSync(path.join(UPLOAD_PATH, result.filename));
    let results = await ipfs.add(fileStream);
    let url = `https://ipfs.io/ipfs/${results[0].hash}`;
    // To Do Encrypt the doc and store private key
    let imageDoc = { id: result.filename, type: result.mimetype, hash: result.hash, data: url };
    // this.database.documentModel.cre
    await database.documentModel.create(imageDoc);
    db.saveDatabase();
    let response = { id: results[0].hash, url: url };
    return response;
  } catch (error) {
    return Boom.badImplementation(error);
  }
}
export default class FileController {

  /**
   * Constructor
   * @param {IServerConfigurations} configs
   * @param {IDatabase} database
   * @param {IHyperledgerConfiguration} hyperledger
   * @param {winston.LoggerInstance} logger
   * @param {ComposerConnection} composerConnection
   */
  constructor(
    private configs: IServerConfigurations,
    private database: IDatabase,
    private logger: LoggerInstance
  ) {
  }
  /**
 * API route: create a new cargo
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
  async uploadDocument(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    try {
      const data = request.payload;
      const file = data['file'];
      let fileId = uuid.v4();
      let response = await uploadDocument(file, this.database, fileId);
      return h.response(response).code(201);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
* API route: create a new cargo
* @param {IRequest} request
* @param {ResponseToolkit} h
* @returns {Promise<any>}
*/
  async verifyDocument(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    try {
      const data = request.payload;
      const file = data['file'];
      let fileId = uuid.v4();

      let response = await uploadDocument(file, this.database, fileId);
      return h.response(response).code(201);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
 * Upload image to ipfs with or without encryption
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<string>}
 */
  async encryptUpload(filestream: Buffer, passPhrase: string): Promise<string> {
    // encry
    if (passPhrase) {
      filestream = publicEncrypt("sdmsd", filestream);
    }
    let results = await ipfs.add(filestream);
    let url = `https://ipfs.io/ipfs/${results[0].hash}`;
    return url;
  }
  /**
   * API route: create a new cargo
   * @param {IRequest} request
   * @param {ResponseToolkit} h
   * @returns {Promise<any>}
   */
  async uploadMultiple(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    let payload: any = request.payload;
    const identity = request.auth.credentials.id;
    try {
      // const data = request.payload;
      const files = payload['files'];

      const filesDetails = await uploader(files, FileOptions, this.database);
      const col = await loadCollection(COLLECTION_NAME, db);
      const result = [].concat(col.insert(filesDetails));
      db.saveDatabase();
      let response = result.map(x => ({ id: x.$loki, fileName: x.filename, originalName: x.originalname, url: path.join(UPLOAD_PATH, x.filename) }));
      return h.response(response).code(201);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  /**
 * API route: create a new cargo
 * @param {IRequest} request
 * @param {ResponseToolkit} h
 * @returns {Promise<any>}
 */
  async uploadAws(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    const identity = request.auth.credentials.id;
    try {
      // let fileOptions;
      const data = request.payload;
      const file = data['file'];
      const fileDetails = await uploader(file, FileOptions, this.database);
      const col = await loadCollection(COLLECTION_NAME, db);
      const result = col.insert(fileDetails);
      db.saveDatabase();
      let res = { id: result.$loki, fileName: result.filename, originalName: result.originalname };
      //save to mongo db
      var fileStream = fs.createReadStream(path.join(UPLOAD_PATH, result.filename));
      fileStream.on('error', function (err) {
        console.log('File Error', err);
      });
      // digital ocean space config
      AWS.config.update({ accessKeyId: 'XXXXXXXXXXXXXXXXXXXX', secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' });
      const spacesEndpoint = new AWS.Endpoint('sfo2.digitaloceanspaces.com/uploads');
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
      });
      var name = `${Date.now().toString()}-${result.originalname}`;
      var objectParams = {
        Bucket: "gbl",
        Key: name,
        Body: fileStream,
        ACL: 'public-read'
      };
      var getParams = {
        Bucket: "gbl",
        Key: name
      };
      await s3.putObject(objectParams).promise();
      var url = await s3.getSignedUrl('getObject', getParams);
      let response = { url: url };
      return h.response(response).code(200);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
   * API route: Get cargo by Id
   * query param: resolve
   * if set to true the composer data is resolved
   * @param {Request} request
   * @param {ReplyNoContinue} reply
   * @returns {Promise<void>}
   */
  async getById(request: IRequest, h: any): Promise<any> {
    const identity = request.auth.credentials.id;
    const id = request.params["documentId"];
    try {
      const col = await loadCollection(COLLECTION_NAME, db);
      const result = col.findOne({ fileName: id });
      // const result = col.get(+id);
      // if (!result) {
      let Doc = await this.database.documentModel.findOne({ id: id });
      if (!Doc) {
        return Boom.notFound("File not available");
      }
      return h.response(Doc).code(200);
      // }
      // if (result) {
      return h.file(path.join(UPLOAD_PATH, result.filename)).header('Content-Type', result.mimetype);
      // } else if (!result) {
      //   return Boom.notFound("Image not available");
      // }
      return h.response(result).code(201); //.header('Content-Type', Doc.type);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
 * API route: Get cargo by Id
 * query param: resolve
 * if set to true the composer data is resolved
 * @param {Request} request
 * @param {ReplyNoContinue} reply
 * @returns {Promise<void>}
 */
  async getFileById(request: IRequest, h): Promise<any> {
    const identity = request.auth.credentials.id;
    const id = request.params["imageId"];
    const resolve = request.query["resolve"] === "true" ? true : false;
    try {
      const col = await loadCollection(COLLECTION_NAME, db);
      const result = col.get(+id);
      if (!result) {
        return Boom.notFound("Image not available");
      }
      return h.file(path.join(UPLOAD_PATH, result.filename)).header('Content-Type', result.mimetype);
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
  /**
   * API route: Delete a cargo
   * @param {IRequest} request
   * @param {ResponseToolkit} h
   * @returns {Promise<any>}
   */
  async delete(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
    let id = request.params["brandId"];
    const identity = request.auth.credentials.id;
    try {
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}