import { Observable } from "rxjs";

import { Event, Module } from "../core/gateway";
import IModule from "../core/module.interface";
import Server from "../core/server";
import Scope from "../core/scope";

@Module("Array")
export default class ArrayModule implements IModule{
    protected Proto: string = "Array.proto";
    private storage: Array<string> = new Array<string>();

    constructor(){
        
    }

    @Event("Array:Insert")
    async insert(){
        //this.storage
    }
}