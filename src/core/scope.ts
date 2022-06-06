import { Observable, BehaviorSubject } from "rxjs";

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

    static setObservable<T>(key: string, observable: Observable<any>, fnPaser: any = null){
        observable.subscribe((data: T) => {
            Scope.set(key, (fnPaser !== null) ? fnPaser(data) : data);
        });

        Scope.pushArray("interceptors", { key, fn: (fnPaser) ? fnPaser.toString() : "" });
    }

    static setReativeProperty<T>(key: string, property: BehaviorSubject<T>){
        property.subscribe((data: T) => {
            Scope.set(key, property.getValue());
        });

        Scope.set(key, property.getValue());
        Scope.set(`${key}:Property`, property);
    }

    static has(key:string){
        return (Scope.state[key]);
    }

    static get(key:string){
        return (Scope.state[key]) ? Scope.state[key] : null;
    }

    static updateProperty(key: string, value: any){
        try{
            Scope.get(`${key}:Property`).next(value);
        }
        catch(e){}
    }
}

export default Scope;