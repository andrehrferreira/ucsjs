import { Request, Response } from 'express';
import { BehaviorSubject } from "rxjs";
import { Controller, Get } from "../core/controller";

import Server from "../core/server";
import Scope from '../core/scope';

@Controller("todo")
export default class ToDoController{
    constructor(server: Server){
        server.createReativeProperty<Array<string>>("Array:ToDo", new BehaviorSubject(new Array<string>()), true);
    }

    @Get("/todo", { template: "todo" })
    getTodoSample(server: Server, req: Request, res: Response){}
}