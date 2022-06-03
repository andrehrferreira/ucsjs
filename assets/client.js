class Main{    
    constructor(){
        this.SSR = null;
        this.events = {};
        this.index = [];
        this.parser = {};
        this.sync = new rxjs.Subject();
        this.mainProto = "Server.proto";
        this.wsUrl = "ws://localhost:3005";
        this.loadProtos();        
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
        let headerParser = this.SSR.lookupType("server.ServerHeaderParser");
        const headerRaw = headerParser.decode(new Uint8Array(event.data));
        
        if(headerRaw.header.type === 0 && this.index.length === 0){
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

    sendMessage(data){
        let message = this.SSR.lookupType("server.ClientMessage");
        const buffer = message.encode(data).finish();
        this.socket.send(buffer);
    }

    addParser(namespace, fn){
        this.parser[namespace] = fn;
    }
}

const USCJS = new Main();
window.uscjs = USCJS;