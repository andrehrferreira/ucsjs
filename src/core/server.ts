import path from "path";
import express, { Express } from 'express';
import * as http from "http";
import * as ws from "ws";
import protobuf, { Constructor } from "protobufjs";
import { v4 as uuidv4 } from "uuid";
import { Observable, BehaviorSubject } from "rxjs";

import Scope from "./scope";
import Render from "./render";
import IModule from './module.interface';

export interface ServerSettings{
    plugins: Array<any>;
    controllers: Array<any>;
    modules: Array<Constructor<IModule>>
}

export class Socket extends ws.WebSocket{
    public id: string;

    constructor(address: null){
        super(address);
        this.id = uuidv4();
    }
}

export default class Server {
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

        let routes: Array<any> = Scope.get("routes");

        if(routes && routes.length> 0){
            for(let route of routes){
                switch(route.type){
                    case "get": this.express.get(route.url, Render.ParseToExpress(route, this)); break;
                }
            }
        }

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
                    this.managerSubscribes[`${ws.id}:${message.event}`] = this.events[message.event]?.subscribe((data: any) => {
                        this.sendMessage(message.event, data, ws);
                    });
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
            ws.send(buffer);
        }
        else if(typeof data === "object"){
            const message = root.fromObject(data);
            const buffer = root.encode(message).finish();
            ws.send(buffer);
        }
    }

    createEvent(namespace: string, observable: Observable<any>, global: boolean = false, fnPaser: Function){
        this.events[namespace] = observable;

        if(global)
            Scope.setObservable(namespace, observable, fnPaser);
    }

    createReativeProperty<T>(namespace: string, property: BehaviorSubject<T>, global: boolean = false){
        //let observable = property.asObservable();
        this.events[namespace] = property;

        if(global)
            Scope.setReativeProperty(namespace, property);
    }

    use(module: IModule){

    }

    async listen(port: number, host: string){
        this.ssrRoot = await protobuf.load('./proto/Server.proto');     
        this.server.listen(port, host);
    }
}