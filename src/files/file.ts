import * as del from 'del';
import * as Loki from 'lokijs';
import * as fs from 'fs';
import * as uuid from 'uuid';
import { IDatabase } from "../database/database";
import * as Mongoose from "mongoose";

interface Image {
  id: string;
  assetId: string;
  thumbnailUrl: string;
  imageUrl: string;
}

export interface IFile extends Mongoose.Document {
  id: string;
  type: string;
  data: Buffer;
}

export const FileSchema = new Mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    type: { type: String, unique: false, required: true },
    data: { type: Buffer, unique: false, required: true },
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

const _fileHandler = async function (file: any, options: FileUploaderOption, database: IDatabase) {
  if (!file) {
    throw new Error('no file');
  }
  //   if (options.fileFilter && !options.fileFilter(file.hapi.filename)) {
  //       throw new Error('type not allowed');
  //   }

  const originalname = file.hapi.filename;
  const filename = uuid.v1();
  const path = `${options.dest}${filename}`;
  const fileStream = fs.createWriteStream(path);
  return new Promise((resolve, reject) => {
    file.on('error', function (err) {
      reject(err);
    });

    file.pipe(fileStream);

    file.on('end', function (err) {
      const fileDetails: FileDetails = {
        fieldname: file.hapi.name,
        originalname: file.hapi.filename,
        filename,
        mimetype: file.hapi.headers['content-type'],
        destination: `${options.dest}`,
        path,
        size: fs.statSync(path).size,
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
export const FileModel = Mongoose.model<IFile>('Files_t', FileSchema);
export { imageFilter, loadCollection, cleanFolder, uploader, FileUploaderOption, FileDetails };