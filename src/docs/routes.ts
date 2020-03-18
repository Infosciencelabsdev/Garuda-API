import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import documentController from './doc-controller';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import * as RequestValidator from "./doc-validator";

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance
) {

  const controller = new documentController(serverConfigs, database, logger);
  server.bind(controller);

  server.route({
    method: 'POST',
    path: `/document/multi`,
    options: {
      handler: controller.uploadMultiple,
      tags: ['api', 'documents'],
      description: `upload multiple document.`,
      auth: 'jwt',
      validate: {
        headers: jwtValidator,
        payload: {
          file: Joi.array().items(Joi.any()
            .meta({ swaggerType: 'file' })
            .required()
            .allow('')
            .description('Array of files.')
          )
        }
      },
      payload: {
        maxBytes: 1048576 * 10,
        output: 'stream',
        allow: 'multipart/form-data'
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `uploaded document.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/document`,
    options: {
      handler: controller.uploadDocument,
      tags: ['api', 'documents'],
      description: `Upload a file.`,
      auth: 'jwt',
      validate: {
        headers: jwtValidator,
        payload: {
          file: Joi.any()
            .meta({ swaggerType: 'file' })
            .required()
            .description('File with max 2 Mb size')
        }
      },
      payload: {
        maxBytes: 1048576 * 2,
        output: 'stream',
        parse: true
        // allow: 'multipart/form-data'
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `uploaded documents.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/document/verify`,
    options: {
      handler: controller.verifyDocument,
      tags: ['api', 'documents'],
      description: `Upload a file.`,
      auth: 'jwt',
      validate: {
        headers: jwtValidator,
        payload: {
          file: Joi.any()
            .meta({ swaggerType: 'file' })
            .required()
            .description('File with max 2 Mb size')
        }
      },
      payload: {
        maxBytes: 1048576 * 2,
        output: 'stream',
        parse: true
        // allow: 'multipart/form-data'
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `uploaded documents.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/document/aws`,
    options: {
      handler: controller.uploadAws,
      tags: ['api', 'documents'],
      description: `upload a document to aws.`,
      auth: 'jwt',
      validate: {
        headers: jwtValidator,
      },
      payload: {
        maxBytes: 1048576 * 10,
        output: 'stream',
        allow: 'multipart/form-data'
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '201': {
              'description': `uploaded documents.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'DELETE',
    path: `/document/{documentId}`,
    options: {
      handler: controller.delete,
      tags: ['api', 'documents'],
      description: `Delete document by id.`,
      auth: 'jwt',
      validate: {
        params: {
          documentId: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Deleted document.`,
            },
            '404': {
              'description': `document does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `/document/{documentId}`,
    options: {
      handler: controller.getById,
      tags: ['api', 'categorys'],
      description: `Get document by id.`,
      auth: 'jwt',
      validate: {
        params: {
          documentId: Joi.string().required(),
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `document found.`
            },
            '404': {
              'description': `documents does not exists.`
            }
          }
        }
      }
    }
  });
}
