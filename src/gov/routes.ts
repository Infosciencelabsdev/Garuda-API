import * as Hapi from "hapi";
import PropertyController from "./gov-controller";
import * as PropertyValidator from "./gov-validator";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from 'joi';

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const passportController = new PropertyController(serverConfigs, database, logger);
    server.bind(passportController);

    server.route({
        method: 'POST',
        path: '/tax',
        handler: passportController.createTax,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Create a tax',
            validate: {
                payload: PropertyValidator.addEditTaxModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property created.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'PUT',
        path: '/tax/{type}',
        handler: passportController.editTax,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Edit',
            validate: {
                params: { type: Joi.string().required() },
                payload: PropertyValidator.addEditTaxModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property created.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/tax/{type}',
        handler: passportController.getPropertyTaxByType,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Get all tax',
            validate: {
                params: { type: Joi.string().required() },
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property created.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/tax',
        handler: passportController.getPropertyTax,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Get all tax',
            validate: {
                // headers: auth,
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property created.'
                        }
                    }
                }
            }
        }
    });
}
