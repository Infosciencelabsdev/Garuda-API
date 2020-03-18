import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import imageController from './file-controller';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import * as RequestValidator from "./file-validator";

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance
) {

  const controller = new imageController(serverConfigs, database, logger);
  server.bind(controller);

  server.route({
    method: 'POST',
    path: `/image/multi`,
    options: {
      handler: controller.uploadMultiple,
      tags: ['api', 'images'],
      description: `upload multiple image.`,
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
              'description': `uploaded image.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/image`,
    options: {
      handler: controller.uploadImage,
      tags: ['api', 'images'],
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
              'description': `uploaded images.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/image/aws`,
    options: {
      handler: controller.uploadAws,
      tags: ['api', 'images'],
      description: `upload a image to aws.`,
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
              'description': `uploaded images.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'DELETE',
    path: `/image/{imageId}`,
    options: {
      handler: controller.delete,
      tags: ['api', 'images'],
      description: `Delete image by id.`,
      auth: 'jwt',
      validate: {
        params: {
          imageId: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Deleted image.`,
            },
            '404': {
              'description': `image does not exists.`
            }
          }
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `/image/{imageId}`,
    options: {
      handler: controller.getById,
      tags: ['api', 'categorys'],
      description: `Get image by id.`,
      auth: 'jwt',
      validate: {
        params: {
          imageId: Joi.string().required(),
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `image found.`
            },
            '404': {
              'description': `images does not exists.`
            }
          }
        }
      }
    }
  });
}
