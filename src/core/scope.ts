import { Observable } from "rxjs";

interface ScopeData{
    key: string;
    data: any;
}

class Scope {
    private static storage: Array<ScopeData> = new Array<ScopeData>();
    public static state: any = {};
    public static enums: any = {};

    static set(key: string, data: any){
        Scope.storage.push({ key, data });
        Scope.state[key] = data;
    }

    static pushArray(key: string, data: any){
        if(!Scope.has(key)){
            Scope.storage.push({ key, data: [ data ] });
            Scope.state[key] = [ data ];
        }            
        else{
            Scope.storage.map((elem, index) => {
                if(elem.key === key){
                    Scope.storage[index].data.push(data);
                    Scope.state[key] = Scope.storage[index].data;
                }                    
            });
        }
    }

    static setEnum(namespace: string, key: string){
        if(!Scope.enums[namespace])
            Scope.enums[namespace] = [];
        
        Scope.enums[namespace].push(key);
    }

    static getEnumItem(namespace: string, key: string){
        if (Scope.enums[namespace]) { 
            return Scope.enums[namespace].indexOf(key);
        } else {
            Scope.setEnum(namespace, key);
            return Scope.enums[namespace].indexOf(key);
        };
    }

    static getEnum(namespace: string){
        return (Scope.enums[namespace]) ? Scope.enums[namespace] : {};
    }

    static getEnumToArray(namespace: string, fn: Function){
        const enumRaw = Scope.getEnum(namespace);
        let arr: Array<any> = [];
        enumRaw.map((value: string, index: number) => arr.push(fn(value, index)));
        return arr;
    }   

    static setObservable<T>(key: string, observable: Observable<any>, fnPaser: Function){
        observable.subscribe((data: T) => {
            Scope.set(key, (fnPaser !== null) ? fnPaser(data) : data);
        });

        Scope.pushArray("interceptors", { key, fn: fnPaser.toString() });
    }

    static has(key:string){
        let item = Scope.storage.filter((elem) => elem.key === key);
        return (item.length > 0);
    }

    static get(key:string){
        let item = Scope.storage.filter((elem) => elem.key === key);
        return (item.length > 0) ? item[0].data : null;
    }
}

export default Scope;