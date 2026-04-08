"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const board_controller_1 = require("../controllers/board.controller");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, board_controller_1.createBoard);
router.get('/', auth_middleware_1.protect, board_controller_1.getUserBoards);
router.get('/shared/:boardId', board_controller_1.getBoardById);
router.get('/:boardId', board_controller_1.getBoardById);
exports.default = router;
