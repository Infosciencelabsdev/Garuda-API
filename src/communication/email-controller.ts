import * as Hapi from "hapi";
import * as Boom from 'boom';
import { IRequest } from '../interfaces/request';

//global config
const sgMail = require('@sendgrid/mail');
const API_KEY = "xx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
sgMail.setApiKey(API_KEY);
sgMail.setSubstitutionWrappers('{{', '}}');
export default class EmailController {
    from = 'info@garuda.in';
    /**
     * Constructor
     * param {IServerConfigurations} configs
     * param {IDatabase} database
     * param {winston.LoggerInstance} logger
     */
    constructor() {
    }

    /**
   * API route: create a new customer
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
    async sendEmail(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
        let payload: any = request.payload;
        const resolve = request.query["resolve"] === "true" ? true : false;
        let templateName = request.params["type"];
        // let userName = payload.name;
        let user = payload.to;
        try {
            // Configure the substitution tag wrappers globally
            // sgMail.setApiKey(this.API_KEY);
            // sgMail.setSubstitutionWrappers('{{', '}}');
            const msg = {
                to: user,
                from: this.from,
                subject: 'Hello world',
                text: 'Hello plain world!',
                html: '<p>Hello HTML world!</p>',
                templateId: '650574d6-e0f1-4249-8646-cd47fb5dbb7a',
                substitutions: {
                    user_name: 'Rajat Wasan'
                },
            };
            await sgMail.send(msg);

            return h.response(payload).code(201);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
    /**
   * API route: create a new customer
   * @param {IRequest} request
   * @param {hapi.ResponseToolkit} h
   * @returns {Promise<Response>}
   */
    async contactUs(request: IRequest, h: Hapi.ResponseToolkit): Promise<any> {
        let payload: any = request.payload;
        const resolve = request.query["resolve"] === "true" ? true : false;
        let message = payload.message;
        let subject = payload.subject;
        try {
            const msg = {
                to: ['support@ownet.in', 'info@ownet.in'],
                from: this.from,
                subject: subject,
                // text: 'Hello plain world!',
                html: '<p>' + message + '</p>',
            };
            await sgMail.send(msg);

            return h.response(payload).code(201);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
    sampleTransactionEmail(message) {
        const msg = {
            to: 'rajat@cognier.co',
            from: this.from,
            subject: 'Hello world',
            text: 'Hello plain world!',
            html: '<p>Hello HTML world!</p>',
            templateId: 'd-a0a77f6784124ecebf1421a03fe4d18e',
            dynamic_template_data: {
              subject: 'Testing transaction Template & Stuff',
              user_name: 'Some "Testing" One',
              description: message,
            },
          };
        return sgMail.send(msg);
    }
}
module.exports.EmailController;