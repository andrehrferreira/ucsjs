import Scope from "./scope";
import { RenderHeader } from "./render";

export let Controller = (namespace?: string) => {
    return function(ctr: Function){
        //console.log(ctr, namespace);
    }
}

export let Get = (url: string, header: RenderHeader = new RenderHeader()) => {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor){
        descriptor.configurable = true;
        Scope.pushArray("routes", { url, header, type: "get", fn: descriptor.value });
    }
}

export function Property(target: any, key: string) {
    const newKey = `_${key}`;

    Object.defineProperty(target, key, {
        get() {
          console.log(`Get: ${key} => ${this[newKey]}`);
          return this[newKey];
        },
        set(newVal) {
          console.log(`Set: ${key} => ${newVal}`);
          this[newKey] = newVal;
        },
        enumerable: true,
        configurable: true
    });
}