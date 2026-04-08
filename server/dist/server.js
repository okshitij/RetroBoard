"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./src/app"));
const db_1 = __importDefault(require("./src/config/db"));
const boardSocket_1 = require("./src/sockets/boardSocket");
dotenv_1.default.config();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
(0, db_1.default)();
const httpServer = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
io.on('connection', (socket) => {
    (0, boardSocket_1.registerBoardSocket)(io, socket);
});
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
