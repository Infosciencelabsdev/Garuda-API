import * as Hapi from "hapi";
import OrganizationController from "./org-controller";
import * as PassportValidator from "./org-validator";
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
    const organizationController = new OrganizationController(server, serverConfigs, database, logger);
    server.bind(organizationController);

    server.route({
        method: 'POST',
        path: '/organization',
        handler: organizationController.createOrg,
        options: {
            auth: 'jwt',
            tags: ['api', 'organization'],
            description: 'Create New organization or builder',
            validate: {
                headers: jwtValidator,
                payload: PassportValidator.createModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Created successfully'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/organization/page={page}',
        handler: organizationController.getAllOrg,
        options: {
            auth: 'jwt',
            tags: ['api', 'organization'],
            notes: 'Returns a organization list by the page number passed in the path',
            description: 'Get all organizations/builders.',
            validate: {
                params: {
                    headers: jwtValidator,
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
        path: '/organization/id={id}',
        handler: organizationController.getById,
        options: {
            auth: 'jwt',
            tags: ['api', 'organization'],
            notes: 'Returns a organization by id',
            description: 'Get organization/builder.',
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
