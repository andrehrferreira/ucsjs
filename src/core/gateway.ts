import Scope from "./scope";

export let Module = (namespace: string) => {
    return function(ctr: Function){
        Scope.pushArray("modules", { constructor: ctr, namespace });
    }
}

export let Event = (name: string) => {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor){
        descriptor.configurable = true;
        //Scope.pushArray("routes", { url, type: "get", fn: descriptor.value });
    }
}