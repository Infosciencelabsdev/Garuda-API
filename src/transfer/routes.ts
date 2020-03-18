import * as Hapi from "hapi";
import Controller from "./transfer-controller";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from "../auth/auth-validator";
import * as Validator from "./transfer-validator";
import * as Joi from 'joi';

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const controller = new Controller(server, serverConfigs, database, logger);
    server.bind(controller);
    server.route({
        method: 'POST',
        path: '/listing/{type}',
        handler: controller.buyRentRequest,
        options: {
            auth: 'jwt',
            tags: ['api', 'marketplace'],
            description: 'Get marketplace properties by user.',
            validate: {
                headers: jwtValidator,
                params: {
                    type: Joi.string().required().valid(["Buy", "Rent", "Transfer", "Delist"]),
                },
                payload: Validator.bidModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '201': {
                            'description': 'Property request recieved.'
                        },
                        '401': {
                            'description': 'Property request invalid.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/listing/page={page}',
        handler: controller.getAllRequest,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get buy requests',
            validate: {
                headers: jwtValidator,
                params: {
                    page: Joi.string().required(),
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
    server.route({
        method: 'GET',
        path: '/listing/add',
        handler: controller.addAllProeprtyName,
        options: {
            auth: 'jwt',
            validate: {
                headers: jwtValidator,
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
    server.route({
        method: 'GET',
        path: '/listing/{id}',
        handler: controller.getRequestById,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get buy requests',
            validate: {
                headers: jwtValidator,
                params: {
                    id: Joi.string().required(),
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
    server.route({
        method: 'PUT',
        path: '/listing/confirm={id}',
        handler: controller.confirmRequest,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Approve or Reject property transfer/sell',
            validate: {
                headers: jwtValidator,
                params: {
                    id: Joi.string().required(),
                },
                payload: Validator.confirmRequestModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '201': {
                            'description': 'Property request recieved.'
                        },
                        '401': {
                            'description': 'Property request invalid.'
                        }
                    }
                }
            }
        }
    });
}
