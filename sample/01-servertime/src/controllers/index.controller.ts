import { Request, Response } from 'express';
import { Controller, Get } from "@ucsjs/common";
import { Server } from "@ucsjs/server";

@Controller("")
export default class IndexController{
    @Get("", "index")
    getIndex(server: Server, req: Request, res: Response){}
}