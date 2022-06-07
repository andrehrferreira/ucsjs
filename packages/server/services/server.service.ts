import path from "path";
import express, { Express } from 'express';
import * as http from "http";
import * as ws from "ws";
import protobuf, { Constructor } from "protobufjs";
import { v4 as uuidv4 } from "uuid";
import { Observable, BehaviorSubject } from "rxjs";

import { PATH_METADATA, METHOD_METADATA, TEMPLATE_MEDATA } from "@ucsjs/common";
import { RequestMethod } from "@ucsjs/common";
import { isConstructor, isUndefined } from "@ucsjs/common";

import { Scope } from "@ucsjs/common";
import Render from "./render.service";

export interface ServerSettings{
    plugins: Array<any>;
    controllers: Array<any>;
    modules: Array<Constructor<any>>
}

export class Socket extends ws.WebSocket{
    public id: string;

    constructor(address: null){
        super(address);
        this.id = uuidv4();
    }
}

export class Server {
    events: any;
    managerSubscribes: any;
    express: Express;
    server: http.Server;
    wss: ws.Server;
    ssrRoot: any;
    settings: ServerSettings;
    modules: any = {};

    constructor(settings: ServerSettings){
        this.events = {};
        this.managerSubscribes = {};
        this.express = express();
        this.settings = settings;
        this.server = http.createServer(this.express);
        this.wss = new ws.Server<Socket>({ server: this.server });

        this.express.set("view engine", "ejs");
        this.express.set("views", path.resolve("./views"));

        this.express.use(express.static("proto"));
        this.express.use(express.static("assets"));

        if(settings.plugins.length > 0){
            for(let plugin of settings.plugins)
                this.express.use(plugin());          
        }

        if(settings.controllers.length > 0){
            for(let controller of settings.controllers)
                new controller(this);          
        }

        this.loadDepentences();
        
        this.wss.on("connection", async (ws: Socket) => {   
            this.sendMessage("Index", { keys: Scope.getEnumToArray("index", (value: string) => value), header: { type: 0 } }, ws);
            ws.on("message", (message) => this.parseMessage(message, ws));
        });

        this.createEvent("ServerTime", new Observable((subscriber) => {
            subscriber.next({ header: { type: Scope.getEnumItem("index","ServerTime") }, datetime: new Date().getTime() });
            setInterval(() => subscriber.next({ header: { type: Scope.getEnumItem("index","ServerTime") }, datetime: new Date().getTime() }), 1000);
        }), true, (data: { datetime: number }) => {
            return new Date(data.datetime).toString() + " - " + data.datetime;
        });
    }

    loadDepentences(){
        Render.LoadBaseTemplate();

        this.settings.controllers.forEach((controller) => {
            const controllerPath = Reflect.getMetadata(PATH_METADATA, controller);
            
            Reflect.ownKeys(controller.prototype).forEach((method) => {
                try{
                    const methodPath = Reflect.getMetadata(PATH_METADATA, controller.prototype[method]);
                    const methodType = Reflect.getMetadata(METHOD_METADATA, controller.prototype[method]);
                    const methodTemplate = Reflect.getMetadata(TEMPLATE_MEDATA, controller.prototype[method]);
                    
                    if(!isUndefined(methodPath) && !isUndefined(methodType) && !isConstructor(method)){
                        const fullPath = (controllerPath) ? `/${controllerPath}${methodPath}` : `/${methodPath}`;

                        const renderTemplate = Render.ParseToExpress({
                            fn: controller.prototype[method],
                            template: methodTemplate
                        }, this);

                        switch(methodType){
                            case RequestMethod.GET: this.express.get(fullPath, renderTemplate); break;
                            case RequestMethod.POST: this.express.post(fullPath, renderTemplate); break;
                            case RequestMethod.PUT: this.express.put(fullPath, renderTemplate); break;
                            case RequestMethod.DELETE: this.express.delete(fullPath, renderTemplate); break;
                            case RequestMethod.ALL: this.express.all(fullPath, renderTemplate); break;
                            case RequestMethod.OPTIONS: this.express.options(fullPath, renderTemplate); break;
                        }
                    }                    
                }
                catch(e){}                
            });
        })

        let modules: Array<any> = Scope.get("modules");

        if(modules && modules.length > 0){
            for(let module of modules)
                this.modules[module.namespace] = new module.constructor();            
        }
    }

    parseMessage(buffer: any, ws: Socket){
        const message = this.parseClientMessage(buffer);
                
        switch(message.type){
            case "subscribe": 
                try{
                    let eventName = (message.namespace) ? message.namespace : message.event;

                    this.managerSubscribes[`${ws.id}:${eventName}`] = this.events[eventName]?.subscribe((data: any) => {
                        this.sendMessage(message.event, data, ws);
                    });

                    if(this.events[eventName] instanceof BehaviorSubject)
                        this.sendMessage(message.event, { data: this.events[eventName].getValue(), ...message }, ws);          
                }   
                catch(e){ console.log(e); }
            break;
            case "unsubscribe": 
                this.managerSubscribes[`${ws.id}:${message.event}`]?.unsubscribe();
            break;
            default: 
                const [Type, Name] = message.event.split(":");
            
                switch(Type){
                    case "Array": 
                        const parseArray = this.parseMessageByType("SyncArray", buffer);
                        Scope.updateProperty(parseArray.namespace, JSON.parse(parseArray.data));
                    break;
                }
            break;
        }
    }

    parseClientMessage(buffer: ArrayBuffer){
        const message = this.ssrRoot.lookupType("ClientMessage");   
        const decode = message.decode(new Uint8Array(buffer));
        return decode;
    }

    parseMessageByType(type: string, buffer: ArrayBuffer){
        const message = this.ssrRoot.lookupType(type);   
        const decode = message.decode(new Uint8Array(buffer));
        return decode;
    }

    sendMessage(type: string, data: any, ws: ws.WebSocket){  
        const root = this.ssrRoot.lookupType(type);     
        
        if(typeof data === "string"){
            const buffer = root.encode(data).finish();

            if(buffer.length > 0)
                ws.send(buffer);
        }
        else if(typeof data === "object"){
            if(typeof data.data == "object")
                data.data = JSON.stringify(data.data);

            const message = root.fromObject(data);
            const buffer = root.encode(message).finish();

            if(buffer.length > 0)
                ws.send(buffer);
        }
    }

    createEvent(namespace: string, observable: Observable<any>, global: boolean = false, fnPaser: Function){
        this.events[namespace] = observable;

        if(global)
            Scope.setObservable(namespace, observable, fnPaser);
    }

    async createReativeProperty<T>(namespace: string, property: BehaviorSubject<T>, global: boolean = false){
        this.events[namespace] = property;

        if(global)
            Scope.setReativeProperty(namespace, property);

        return this.events[namespace];
    }

    async listen(port: number, host: string){
        this.ssrRoot = await protobuf.load('./proto/Server.proto');     
        this.server.listen(port, host);
    }
}