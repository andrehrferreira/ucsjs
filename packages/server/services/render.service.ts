import fs from "fs";
import path from "path";
import ejs from "ejs";
import { Request, Response } from 'express';
import { Scope } from '@ucsjs/common';
import { Server } from "./server.service";

export interface IRenderSettings{
    template?: string;
    fn: Function;
}

export default class Render{
    public static _base: string;

    public static async LoadBaseTemplate(){
        this._base = fs.readFileSync(path.resolve("./views/_default.ejs")).toString();
    }

    public static MergeBaseTemplate(currentTemplate: string){
        const startPos = currentTemplate.indexOf("<body>");        
        const startTemplate = currentTemplate.substring(0, startPos);
        const endTemplate = currentTemplate.replace(`${startTemplate}<body>`, "");
        return `${startTemplate}\r\n<body>\r\n${this._base}\r\n${endTemplate}`;
    }

    public static ParseToExpress(renderSettings: IRenderSettings, server: Server): any{
        return async (req: Request, res: Response) => {            
            if(renderSettings.template !== ""){
                let template = fs.readFileSync(path.resolve(`./views/${renderSettings.template}.ejs`)).toString();
                let parsedTemplate = this.MergeBaseTemplate(template);
                let fnTemplate = await renderSettings.fn(server, req, res, parsedTemplate);
                const output = ejs.render(fnTemplate ? fnTemplate : parsedTemplate, { ...Scope.state, Scope: Scope });
                res.send(output).end();
            }
        };
    }
}