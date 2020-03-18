import TeaSchool from 'tea-school';
import * as pug from 'pug';
import * as path from 'path';
import { PDFOptions } from 'puppeteer';
import { Options as SassOptions } from 'node-sass';

import { TransferContract } from './models';
import uuid = require('uuid');
let pugOptions = {
    cache: true
};
let certificatePath = path.resolve(__dirname, "certificate.pug");
// Compile a function
var certificateFn = pug.compileFile(certificatePath, pugOptions);

let contractPath = path.resolve(__dirname, "transfer.pug");
var buyFn = pug.compileFile(contractPath, pugOptions);

export enum templateType { landTransfer = "landTransfer", certificate = "certificate", rent = "rent" }

export async function createTemplate(templateType: templateType, object, filename) {
    /*STYLE OPTIONS*/
    const styleOptions: SassOptions = {
        // Get relative path from cwd to the desired file
        file: path.resolve(__dirname, 'invoice-pdf.scss'),
    };

    let htmlTemplateFn = buyFn;
    let template = 'transfer.pug';
    console.log(" Object " + JSON.stringify(object));
    /*TEMPLATE OPTIONS*/
    let htmlTemplateOptions: pug.LocalsObject = {
        land_transfer: object,
    };
    if (templateType === "landTransfer") {
        template = 'transfer.pug';
        htmlTemplateFn = buyFn;
    } else if (templateType === "rent") {
        template = 'rental.pug';
    } else if (templateType === "certificate") {
        template = 'certificate.pug';
        // htmlTemplateFn = certificateFn;
        htmlTemplateOptions = {
            certificate: object
        };
    }
    console.log(" Object " + JSON.stringify(htmlTemplateOptions));

    /********************************
     *      TEMPLATE FILE PATH      *
     ********************************/
    // Get relative path from cwd to the desired file
    const htmlTemplatePath = path.resolve(__dirname, template);
    console.log(" Path is " + htmlTemplatePath);
    // let filename = uuid.v1();
    // let time = new Date();
    /********************************
     *        PDF FILE OPTIONS      *
     ********************************/
    const pdfOptions: PDFOptions = {
        // Output path will be relative
        path: path.resolve(__dirname, 'output', filename),
        format: 'A5',
        landscape: true,
    };

    /********************************
     *      PUTTING IT TOGETHER     *
     ********************************/
    const teaSchoolOptions: TeaSchool.GeneratePdfOptions = {
        // styleOptions,
        // htmlTemplateFn,
        htmlTemplatePath,
        htmlTemplateOptions,
        pdfOptions,
    };

    /**************************************************************
     *      GENERATED PDF AS A FILE AND ALSO SAVED TO A FILE      *
     **************************************************************/
    const pdfFile = await TeaSchool.generatePdf(teaSchoolOptions);

    return pdfFile;
}