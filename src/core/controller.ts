import Scope from "./scope";

export let Controller = (namespace?: string) => {
    return function(ctr: Function){
        //console.log(ctr, namespace);
    }
}

export let Get = (url: string) => {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor){
        descriptor.configurable = true;
        Scope.pushArray("routes", { url, type: "get", fn: descriptor.value });
    }
}