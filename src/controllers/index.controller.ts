import { Request, Response } from 'express';
import { Controller, Get } from "../core/controller";
import Scope from '../core/scope';

@Controller()
export default class IndexController{
    @Get("/")
    getIndex(req: Request, res: Response){
        res.render("index.mst", Scope.state);
    }
}