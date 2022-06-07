import { Server } from "@ucsjs/server";

import compression from "compression";

import IndexController from "./controllers/index.controller";

new Server({
    plugins: [compression],
    controllers: [IndexController],
    modules: []
}).listen(3005, "0.0.0.0");