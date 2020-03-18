import * as Hapi from "hapi";
import SearchController from "./push-controller";
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
    const searchController = new SearchController(serverConfigs, database, logger);
    server.bind(searchController);
    server.route({
        method: 'GET',
        path: '/search/user/keyword={keyword}',
        handler: searchController.sendNotification,
        options: {
            auth: 'jwt',
            tags: ['api', 'search', 'user'],
            description: 'Get all users.',
            validate: {
                params: {
                    keyword: Joi.string().required().trim(),
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
        path: '/search/org/keyword={keyword}',
        handler: searchController.subscription,
        options: {
            auth: 'jwt',
            tags: ['api', 'search', 'org'],
            description: 'Get all organizations.',
            validate: {
                params: {
                    keyword: Joi.string().required().trim(),
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
}
