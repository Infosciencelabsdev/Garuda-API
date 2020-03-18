import * as del from 'del';
import * as Loki from 'lokijs';
import * as fs from 'fs';
import * as uuid from 'uuid';
import { IDatabase } from "../database/database";
import * as Mongoose from "mongoose";
import * as crypto from "crypto";
// const md5 = require('md5');

export interface IDocument extends Mongoose.Document {
  id: string;
  type: string;
  hash: string;
  filename: string;
  // public: string;
  // private: string;
  data: Buffer;
}


export const DocumentSchema = new Mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    type: { type: String, unique: false, required: true },
    filename: { type: String, unique: false, required: true },
    hash: { type: String, unique: false, required: true },
    data: {
      type: Buffer, unique: false, required: true, index: "hashed"
    }
  },
  {
    timestamps: true
  });
interface FileUploaderOption {
  dest: string;
  //   fileFilter?(fileName: string): boolean;
}

interface FileDetails {
  fieldname: string;
  originalname: string;
  filename: string;
  mimetype: string;
  destination: string;
  path: string;
  size: number;
  hash: string | Buffer;
}
const imageFilter = function (fileName: string) {
  // accept image only
  if (!fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
    return false;
  }
  return true;
};

const loadCollection = function (colName, db: Loki): Promise<Loki.Collection<any>> {
  return new Promise(resolve => {
    db.loadDatabase({}, () => {
      const _collection = db.getCollection(colName) || db.addCollection(colName);
      resolve(_collection);
    });
  });
};

const cleanFolder = function (folderPath) {
  // delete files inside folder but not the folder itself
  del.sync([`${folderPath}/**`, `!${folderPath}`]);
};

const uploader = function (file: any, options: any, database: IDatabase) {
  if (!file) {
    throw new Error('no file(s)');
  }
  return Array.isArray(file) ? _filesHandler(file, options, database) : _fileHandler(file, options, database);
};
var hash = crypto.createHash('md5');

const _fileHandler = async function (file: any, options: FileUploaderOption, database: IDatabase) {
  if (!file) {
    throw new Error('no file');
  }
  //   if (options.fileFilter && !options.fileFilter(file.hapi.filename)) {
  //       throw new Error('type not allowed');
  //   }
  if (!file.hapi) {
    file.hapi = {
      name: uuid.v1,
      filename: uuid.v1,
      headers: { 'content-type': "application/pdf" }
    };
  }

  // const originalname = file.hapi.filename;
  const filename = uuid.v1();
  const path = `${options.dest}${filename}`;
  const fileStream = fs.createWriteStream(path);
  return new Promise((resolve, reject) => {
    file.on('error', function (err) {
      reject(err);
    });

    file.pipe(fileStream);
    file.pipe(hash);

    file.on('end', function (err) {
      hash.end();
      const fileDetails: FileDetails = {
        fieldname: file.hapi.name ? file.hapi.name : uuid.v1(),
        originalname: file.hapi.filename ? file.hapi.filename : uuid.v1(),
        filename,
        mimetype: file.hapi.headers['content-type'] ? file.hapi.headers['content-type'] : "application/pdf",
        destination: `${options.dest}`,
        path,
        size: fs.statSync(path).size,
        hash: hash.read()
      };
      resolve(fileDetails);
    });
  });
};

const _filesHandler = function (files: any[], options: any, database: IDatabase) {
  if (!files || !Array.isArray(files)) {
    throw new Error('no files');
  }
  const promises = files.map(x => _fileHandler(x, options, database));
  return Promise.all(promises);
};
export const DocumentModel = Mongoose.model<IDocument>('Docs_T', DocumentSchema);
// DocumentModel
export { imageFilter, loadCollection, cleanFolder, uploader, FileUploaderOption, FileDetails };