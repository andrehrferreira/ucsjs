import fs from "fs";
import path from "path";
import { Request, Response } from 'express';
import { BehaviorSubject } from "rxjs";
import { Controller, Get } from "@ucsjs/common";

import { Server } from "@ucsjs/server";

@Controller("todo")
export default class ToDoController{
    constructor(server: Server){
        const persistFile = path.resolve("./data/todo.json");

        server.createReativeProperty<Array<string>>("Array:ToDo", new BehaviorSubject(new Array<string>()), true).then((Property) => {
            if(fs.existsSync(persistFile))
                Property?.next(JSON.parse(fs.readFileSync(persistFile).toString()));
            
            Property?.subscribe((value: Array<string>) => { 
                fs.writeFileSync(path.resolve(persistFile), JSON.stringify(value)) 
            })
        });
    }

    @Get("/", "todo")
    getTodoSample(server: Server, req: Request, res: Response){}
}