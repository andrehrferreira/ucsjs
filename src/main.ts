import Scope from "./core/scope";
import Server from "./core/server";

import IndexController from "./controllers/index.controller";
import ArrayModule from "./modules/array.module";

new Server({
    controllers: [IndexController],
    modules: [ArrayModule]
}).listen(3005, "0.0.0.0");