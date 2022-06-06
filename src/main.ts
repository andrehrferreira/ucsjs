import compression from "compression";

import Server from "./core/server";

import IndexController from "./controllers/index.controller";
import ToDoController from "./controllers/todo.controller";
import ArrayModule from "./modules/array.module";

new Server({
    plugins: [compression],
    controllers: [IndexController, ToDoController],
    modules: [ArrayModule]
}).listen(3005, "0.0.0.0");