import { Request, Response } from 'express';
import { Controller, Get } from "../core/controller";
import Server from "../core/server";

@Controller()
export default class IndexController{
    @Get("/", { template: "index" })
    getIndex(server: Server, req: Request, res: Response){
        return null;
    }
}