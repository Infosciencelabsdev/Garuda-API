import * as Hapi from "hapi";
import PropertyController from "./market-controller";
import * as PropertyValidator from "./market-validator";
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
    const passportController = new PropertyController(server, serverConfigs, database, logger);
    server.bind(passportController);

    server.route({
        method: 'POST',
        path: '/marketplace',
        handler: passportController.listProperty,
        options: {
            auth: 'jwt',
            tags: ['api', 'marketplace'],
            description: 'List property to marketplace',
            validate: {
                headers: jwtValidator,
                payload: PropertyValidator.listPropertyModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property listed.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'PUT',
        path: '/marketplace/delist',
        handler: passportController.delistProperty,
        options: {
            auth: 'jwt',
            tags: ['api', 'marketplace'],
            description: 'Delist property from marketplace',
            validate: {
                headers: jwtValidator,
                payload: PropertyValidator.delistPropertyModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property listed.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/marketplace/{id}',
        handler: passportController.getMarketById,
        options: {
            auth: false,
            tags: ['api', 'property'],
            description: 'Get property by id.',
            validate: {
                params: {
                    id: Joi.string().required()
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property retrieved.'
                        },
                        '401': {
                            'description': 'Property not found.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/marketplace/page={page}',
        handler: passportController.getMarketplace,
        options: {
            auth: false,
            tags: ['api', 'marketplace'],
            description: 'Get all properties in marketplace.',
            validate: {
                params: {
                    page: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Marketplace retrieved.'
                        },
                        '401': {
                            'description': 'Marketplace not found.'
                        }
                    }
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/marketplace/user={userId}/page={page}',
        handler: passportController.getUserListing,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get marketplace properties by user.',
            validate: {
                headers: jwtValidator,
                params: {
                    page: Joi.string().required(),
                    userId: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Property list retrieved.'
                        },
                        '401': {
                            'description': 'Property list not found.'
                        }
                    }
                }
            }
        }
    });
}
