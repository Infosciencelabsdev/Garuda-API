import * as Hapi from "hapi";
import Controller from "./trx-controller";
import { IDatabase } from "../database/database";
import { IServerConfigurations } from "../configurations";
import { LoggerInstance } from 'winston';
import * as Joi from 'joi';

export default function (
    server: Hapi.Server,
    serverConfigs: IServerConfigurations,
    database: IDatabase,
    logger: LoggerInstance
) {
    const controller = new Controller(serverConfigs, database, logger);
    server.bind(controller);


    server.route({
        method: 'GET',
        path: '/transaction/page={page}',
        handler: controller.getAllTransaction,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Get all Transaction.',
            validate: {
                params: {
                    page: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Transaction list retrieved.'
                        },
                        '401': {
                            'description': 'Transaction list not found.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/transaction/id={id}',
        handler: controller.getTransactionById,
        options: {
            auth: 'jwt',
            tags: ['api', 'passports'],
            description: 'Get transaction by id',
            validate: {
                params: {
                    id: Joi.string().required(),
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Transaction retrieved.'
                        },
                        '401': {
                            'description': 'Transaction not found.'
                        }
                    }
                }
            }
        }
    });
}
