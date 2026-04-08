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
exports.voteNote = exports.deleteNote = exports.updateNote = exports.createNote = exports.getNotesByBoard = void 0;
const note_model_1 = __importDefault(require("../models/note.model"));
const board_model_1 = __importDefault(require("../models/board.model"));
const getNotesByBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { boardId } = req.params;
        const notes = yield note_model_1.default.find({ boardId }).sort({ createdAt: 1 });
        return res.status(200).json({ notes });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load notes', error });
    }
});
exports.getNotesByBoard = getNotesByBoard;
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { boardId, columnId, content } = req.body;
        if (!boardId || !columnId || !content) {
            return res.status(400).json({ message: 'boardId, columnId and content are required' });
        }
        const board = yield board_model_1.default.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        const note = yield note_model_1.default.create({
            boardId,
            columnId,
            content,
            author: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        });
        return res.status(201).json({ note });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create note', error });
    }
});
exports.createNote = createNote;
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { noteId } = req.params;
        const { content } = req.body;
        const note = yield note_model_1.default.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        if (note.author.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(403).json({ message: 'Not allowed to update this note' });
        }
        note.content = content !== null && content !== void 0 ? content : note.content;
        yield note.save();
        return res.status(200).json({ note });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to update note', error });
    }
});
exports.updateNote = updateNote;
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { noteId } = req.params;
        const note = yield note_model_1.default.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        if (note.author.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(403).json({ message: 'Not allowed to delete this note' });
        }
        yield note.deleteOne();
        return res.status(200).json({ message: 'Note deleted' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to delete note', error });
    }
});
exports.deleteNote = deleteNote;
const voteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { noteId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const note = yield note_model_1.default.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        const existingVote = note.votes.some((vote) => vote.toString() === userId);
        if (existingVote) {
            note.votes = note.votes.filter((vote) => vote.toString() !== userId);
        }
        else {
            note.votes.push(userId);
        }
        yield note.save();
        return res.status(200).json({ note });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to vote note', error });
    }
});
exports.voteNote = voteNote;
