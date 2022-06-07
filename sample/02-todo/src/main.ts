import { Server } from "@ucsjs/server";

import compression from "compression";
import ToDoController from "./controllers/todo.controller";

new Server({
    plugins: [compression],
    controllers: [ToDoController],
    modules: []
}).listen(3005, "0.0.0.0");