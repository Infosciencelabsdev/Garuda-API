import * as Hapi from "hapi";
import PassportController from "./user-controller";
import * as PassportValidator from "./user-validator";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import { jwtValidator } from '../auth/auth-validator';
import * as Joi from "joi";
import * as Boom from "boom";

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const passportController = new PassportController(server, serverConfigs, database, logger);
    server.bind(passportController);

    server.route({
        method: 'POST',
        path: '/signup',
        handler: passportController.registerUser,
        options: {
            auth: false,
            tags: ['api', 'passports'],
            description: 'Register new user',
            validate: {
                payload: PassportValidator.registerModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User Registered successfully'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'POST',
        path: '/login',
        handler: passportController.getLoginToken,
        options: {
            auth: false,
            tags: ['api', 'passports'],
            description: 'Get passport token.',
            validate: {
                payload: PassportValidator.loginModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Passport token retrieved.'
                        }
                    }
                }
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/user',
        handler: passportController.createUser,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Register new user',
            validate: {
                payload: PassportValidator.registerModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User Registered successfully'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'PUT',
        path: '/user',
        handler: passportController.updateProfile,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Update user profile',
            validate: {
                payload: PassportValidator.updateProfile
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Profile Updated.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'PUT',
        path: '/user/role',
        handler: passportController.changeRole,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Update user role',
            validate: {
                payload: PassportValidator.changeRole
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Updated user role'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/user/page={page}',
        handler: passportController.getAllUsers,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Get all users.',
            validate: {
                params: {
                    page: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Users list retrieved.'
                        },
                        '401': {
                            'description': 'Users list not found.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/user/id={id}',
        handler: passportController.getByid,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Get user by id.',
            validate: {
                params: {
                    id: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User retrieved.'
                        },
                        '401': {
                            'description': 'User not found.'
                        }
                    }
                }
            }
        }
    });
    // logger.info();
    server.route({
        method: ['GET', 'POST'],
        path: '/{any*}',
        handler: (request, h) => {
            const accept = request.headers.accept;
            if (accept && accept.match(/json/)) {
                return Boom.notFound('this resource isn’t available.');
            }
            const ip = request.headers['x-real-ip'] || request.info.remoteAddress;
            logger.info(" IP requested from " + ip + "route is '" + request.url.path + "'");
            return h.response('404').code(404);
        }
    });
}
