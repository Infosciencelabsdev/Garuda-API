import * as Hapi from "hapi";
import PropertyController from "./asset-controller";
import * as PropertyValidator from "./asset-validator";
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
        path: '/property',
        handler: passportController.createProperty,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Create new property',
            validate: {
                headers: jwtValidator,
                payload: PropertyValidator.createPropertyModel
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
        path: '/property/page={page}',
        handler: passportController.getAllProperties,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
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
        path: '/property/{propertyId}',
        handler: passportController.getPropertyById,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get property by id.',
            validate: {
                headers: jwtValidator,
                params: {
                    propertyId: Joi.string().required()
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
        path: '/property/user={userId}/page={page}',
        handler: passportController.getUserProperties,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
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
    server.route({
        method: 'PUT',
        path: '/property/confirm',
        handler: passportController.confirmProperty,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Confirm property.',
            validate: {
                headers: jwtValidator,
                payload: PropertyValidator.confirmPropertyModel,
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
        method: 'PUT',
        path: '/property/{propertyId}',
        handler: passportController.updateProperty,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get property by id.',
            validate: {
                headers: jwtValidator,
                params: {
                    propertyId: Joi.string().required()
                },
                payload: PropertyValidator.editPropertyModel
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
        method: 'DELETE',
        path: '/property/{propertyId}',
        handler: passportController.deleteById,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get property by id.',
            validate: {
                headers: jwtValidator,
                params: {
                    propertyId: Joi.string().required()
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
        path: '/sales/user={userId}/page={page}',
        handler: passportController.getUserSoldProperties,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
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
    server.route({
        method: 'GET',
        path: '/sales/page={page}',
        handler: passportController.getSoldProperties,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
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
        path: '/bought/user={userId}/page={page}',
        handler: passportController.getBoughtProperties,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
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
    server.route({
        method: 'GET',
        path: '/update',
        handler: passportController.updatePropertyData,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
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
        path: '/updatet/page={page}',
        handler: passportController.updateTitleData,
        options: {
            auth: 'jwt',
            tags: ['api', 'property'],
            description: 'Get all properties.',
            validate: {
                headers: jwtValidator,
                params: {
                    page: Joi.number().required()
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
