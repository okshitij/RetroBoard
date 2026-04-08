"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const note_controller_1 = require("../controllers/note.controller");
const router = express_1.default.Router();
router.get('/board/:boardId', note_controller_1.getNotesByBoard);
router.post('/', auth_middleware_1.protect, note_controller_1.createNote);
router.put('/:noteId', auth_middleware_1.protect, note_controller_1.updateNote);
router.delete('/:noteId', auth_middleware_1.protect, note_controller_1.deleteNote);
router.post('/:noteId/vote', auth_middleware_1.protect, note_controller_1.voteNote);
exports.default = router;
