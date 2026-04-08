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
exports.registerBoardSocket = void 0;
const note_model_1 = __importDefault(require("../models/note.model"));
const registerBoardSocket = (io, socket) => {
    socket.on('join-board', (boardId) => {
        socket.join(boardId);
        socket.to(boardId).emit('user:joined', { socketId: socket.id });
    });
    socket.on('note:add', (payload) => __awaiter(void 0, void 0, void 0, function* () {
        const note = yield note_model_1.default.create({
            boardId: payload.boardId,
            columnId: payload.columnId,
            content: payload.content,
            author: payload.authorId,
        });
        io.to(payload.boardId).emit('note:added', note);
    }));
    socket.on('note:update', (payload) => __awaiter(void 0, void 0, void 0, function* () {
        const note = yield note_model_1.default.findByIdAndUpdate(payload.noteId, { content: payload.content }, { new: true });
        if (note) {
            io.to(note.boardId.toString()).emit('note:updated', note);
        }
    }));
    socket.on('note:delete', (noteId) => __awaiter(void 0, void 0, void 0, function* () {
        const note = yield note_model_1.default.findByIdAndDelete(noteId);
        if (note) {
            io.to(note.boardId.toString()).emit('note:deleted', noteId);
        }
    }));
    socket.on('note:vote', (payload) => __awaiter(void 0, void 0, void 0, function* () {
        const note = yield note_model_1.default.findById(payload.noteId);
        if (!note)
            return;
        const alreadyVoted = note.votes.map(String).includes(payload.userId);
        if (alreadyVoted) {
            note.votes = note.votes.filter((v) => v.toString() !== payload.userId);
        }
        else {
            note.votes.push(payload.userId);
        }
        yield note.save();
        io.to(note.boardId.toString()).emit('note:voted', note);
    }));
    socket.on('timer:start', (payload) => {
        let remaining = payload.durationSeconds;
        const interval = setInterval(() => {
            remaining--;
            io.to(payload.boardId).emit('timer:tick', { remaining });
            if (remaining <= 0)
                clearInterval(interval);
        }, 1000);
    });
    socket.on('disconnect', () => {
        socket.broadcast.emit('user:left', { socketId: socket.id });
    });
};
exports.registerBoardSocket = registerBoardSocket;
