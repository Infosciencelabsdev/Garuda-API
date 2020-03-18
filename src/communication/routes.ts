import * as Hapi from "hapi";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';
import * as RequestValidator from "./email-validator";
import EmailController from "./email-controller";

export default function (
  server: Hapi.Server,
  serverConfigs: IServerConfigurations,
  database: IDatabase,
  logger: LoggerInstance
) {

  const controller = new EmailController();
  server.bind(controller);

  server.route({
    method: 'POST',
    path: `/sendemail/{type}`,
    options: {
      handler: controller.sendEmail,
      tags: ['api', 'customers'],
      description: `Update customer general details by id.`,
      auth: 'jwt',
      validate: {
        params: {
          type: Joi.string().required()
        },
        headers: jwtValidator
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            '200': {
              'description': `Updated customer.`,
            },
            '404': {
              'description': `customer does not exists.`
            }
          }
        }
      }
    }
  });
  server.route({
    method: 'POST',
    path: `/contactus`,
    options: {
      handler: controller.contactUs,
      tags: ['api', 'customers'],
      description: `send contact form`,
      auth: false,
      validate: {
        payload: RequestValidator.contactUsModel
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
}
