"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardNotes = exports.getBoardById = exports.getUserBoards = exports.createBoard = void 0;
const board_model_1 = __importDefault(require("../models/board.model"));
const note_model_1 = __importDefault(require("../models/note.model"));
const createBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, sprintName } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!title || !sprintName) {
            return res.status(400).json({ message: 'Title and sprint name are required' });
        }
        const board = yield board_model_1.default.create({
            title,
            sprintName,
            owner: userId,
            members: [userId],
        });
        return res.status(201).json({ board });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create board', error });
    }
});
exports.createBoard = createBoard;
const getUserBoards = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const boards = yield board_model_1.default.find({
            $or: [
                { owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId },
                { members: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId },
            ],
        }).sort({ createdAt: -1 });
        return res.status(200).json({ boards });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load boards', error });
    }
});
exports.getUserBoards = getUserBoards;
const getBoardById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boardId } = req.params;
        const board = yield board_model_1.default.findById(boardId)
            .populate('owner', 'username email')
            .populate('members', 'username email');
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        return res.status(200).json({ board });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load board', error });
    }
});
exports.getBoardById = getBoardById;
const getBoardNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boardId } = req.params;
        const notes = yield note_model_1.default.find({ boardId }).sort({ createdAt: 1 });
        return res.status(200).json({ notes });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load board notes', error });
    }
});
exports.getBoardNotes = getBoardNotes;
