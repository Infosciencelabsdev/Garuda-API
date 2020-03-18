import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import * as RequestValidator from "./certificate-validator";
import CertificateController from "./certificate-controller";

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance
) {

  const controller = new CertificateController(serverConfigs, database, logger);

  server.bind(controller);

  server.route({
    method: 'GET',
    path: `/certificate/id={propertyId}`,
    options: {
      handler: controller.getPropertyCertificateById,
      tags: ['api', 'customers'],
      description: `Get certificate.`,
      auth: 'jwt',
      validate: {
        params: {
          propertyId: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `certificate retrieved.`,
            },
            '404': {
              'description': `certificate does not exists.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/certificate/verify/id={id}`,
    options: {
      handler: controller.verifyCertificate,
      tags: ['api', 'customers'],
      description: `send contact form`,
      auth: false,
      validate: {
        params: {
          id: Joi.string().required()
        },
        headers: jwtValidator,
        payload: RequestValidator.verifyCertificate
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Contact form Sent`,
            },
            '404': {
              'description': `Unable to send. Try Again`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'GET',
    path: `/contract/property={propertyId}`,
    options: {
      handler: controller.getTitleContractById,
      tags: ['api', 'customers'],
      description: `Get certificate.`,
      auth: 'jwt',
      validate: {
        params: {
          propertyId: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `contract retrieved.`,
            },
            '404': {
              'description': `contract does not exists.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'GET',
    path: `/contract/user={userId}`,
    options: {
      handler: controller.getContractByUser,
      tags: ['api', 'customers'],
      description: `Get certificate.`,
      auth: 'jwt',
      validate: {
        params: {
          userId: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `certificate retrieved.`,
            },
            '404': {
              'description': `certificate does not exists.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/contract/verify/id={id}`,
    options: {
      handler: controller.verifyCertificate,
      tags: ['api', 'customers'],
      description: `send contact form`,
      auth: false,
      validate: {
        params: {
          id: Joi.string().required()
        },
        headers: jwtValidator,
        payload: RequestValidator.verifyCertificate
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Contact form Sent`,
            },
            '404': {
              'description': `Unable to send. Try Again`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'GET',
    path: `/contract`,
    options: {
      handler: controller.getAllContracts,
      tags: ['api', 'customers'],
      description: `Get certificate.`,
      auth: 'jwt',
      validate: {
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `contracts retrieved.`,
            },
            '404': {
              'description': `contracts does not exists.`
            }
          }
        }
      }
    }
  });
}
