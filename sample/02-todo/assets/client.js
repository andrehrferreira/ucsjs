class Main{    
    constructor(){
        this.SSR = null;
        this.events = {};
        this.index = [];
        this.parser = {};
        this.eventType = {};
        this.lastMessage = null;
        this.sync = new rxjs.Subject();
        this.mainProto = "Server.proto";
        this.wsUrl = "ws://localhost:3005";
        this.loadProtos();    
        this.parserSSRData();    
    }

    async loadProtos(){
        this.SSR = await new Promise((resolve, reject) => { protobuf.load(this.mainProto, (err, root) => {
            if(err) reject(err);
            else resolve(root)
        })});

        this.socket = new WebSocket(this.wsUrl);    
        this.socket.binaryType = 'arraybuffer';
        this.socket.addEventListener("open", this.onConnect.bind(this));    
        this.socket.addEventListener("error", (err) => console.log("error: ", err));    
        this.socket.addEventListener("close", () => setTimeout(() => document.location.reload(true), 1000));    
        this.socket.addEventListener('message', (event) => this.onMessage(event));
    }

    async parserSSRData(){
        window.addEventListener('load', (event) => {
            document.querySelectorAll("div[ssr-data]").forEach((elem) => {
                elem.outerHTML = "<!-- -->";
            })
        });
    }

    bindEvents(){
        const elements = document.querySelectorAll("subscribe");

        elements.forEach((elem) => {
            const type = elem.getAttribute("type");
            this.sendMessage({type: "subscribe", event: type});

            if(!this.events[type]){
                this.events[type] = new rxjs.Subject();
                this.events[type].subscribe({ next: (value) => {                    
                    elem.innerHTML = (this.parser[type]) ? this.parser[type](value) : value;
                }});
            }
        });        
    }

    onConnect(event){
        this.sync.next(true);
        this.bindEvents();
    }

    onMessage(event){
        try{
            this.lastMessage = event;
            let clientPacket, headerRaw = null;

            try{
                let headerParser = this.SSR.lookupType("server.ServerHeaderParser");
                headerRaw = headerParser.decode(new Uint8Array(event.data));
            }
            catch(e){
                let headerParser = this.SSR.lookupType("server.ClientMessage");
                clientPacket = headerParser.decode(new Uint8Array(event.data)); 
            }

            if(clientPacket && this.eventType[clientPacket.event]){
                const indexRoot = this.SSR.lookupType(`server.${this.eventType[clientPacket.event]}`);
                const indexList = indexRoot.decode(new Uint8Array(event.data));

                if(clientPacket.event == "SyncArray" || clientPacket.event == "SyncObject")
                    indexList.data = JSON.parse(indexList.data);

                if(this.events[indexList.namespace])
                    this.events[indexList.namespace].next(indexList.data, indexList);
            }
            else if(headerRaw.header.type === 0 && this.index.length === 0){
                const indexRoot = this.SSR.lookupType("server.Index");
                const indexList = indexRoot.decode(new Uint8Array(event.data));
                this.index = indexList.keys;
            }             
            else{
                const indexRoot = this.SSR.lookupType(`server.${this.index[headerRaw.header.type]}`);
                const indexList = indexRoot.decode(new Uint8Array(event.data));
                
                if(this.events[this.index[headerRaw.header.type]])
                    this.events[this.index[headerRaw.header.type]].next(indexList);
            }   
        }
        catch(e){ console.log(e); }
    }

    sendMessage(data, type = "server.ClientMessage"){
        let message = this.SSR.lookupType(type);
        const buffer = message.encode(data).finish();
        const readyState = (this.socket && this.socket.readyState == WebSocket.OPEN);

        if(readyState)
            this.socket.send(buffer);

        return readyState;
    }

    addParser(namespace, fn){
        this.parser[namespace] = fn;
    }

    next(namespace, value){
        if(typeof value == "string"){

        }
        else if(typeof value == "number"){

        }
        else if(Array.isArray(value)){
            let message = this.SSR.lookupType("server.SyncArray");
            const buffer = message.encode({ namespace: namespace, data: JSON.stringify(value) }).finish();
            this.socket.send(buffer);
        }
    }

    vue3Plugin(){
        return {
            install(app, options){
                app.config.globalProperties.$subcribe = (event, namespace, fn) => {
                    USCJS.eventType[namespace] = event;

                    let persist = setInterval(() => {
                        if(this.SSR !== null){
                            if(USCJS.sendMessage({type: "subscribe", event, namespace})){                                
                                if(!USCJS.events[namespace])
                                    USCJS.events[namespace] = new rxjs.Subject();
                                
                                USCJS.events[namespace].subscribe({ next: (value, message) => fn(value, message) });
                                clearInterval(persist);
                            }
                        }
                    }, 100);                    
                }
            }
        };
    }
}

const USCJS = new Main();
document.uscjs = USCJS;
window.uscjs = USCJS;