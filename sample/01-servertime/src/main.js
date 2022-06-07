"use strict";
exports.__esModule = true;
var server_1 = require("@ucsjs/server");
var compression_1 = require("compression");
var index_controller_1 = require("./controllers/index.controller");
new server_1.Server({
    plugins: [compression_1["default"]],
    controllers: [index_controller_1["default"]],
    modules: []
}).listen(3005, "0.0.0.0");
