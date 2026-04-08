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
exports.getCurrentUser = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const createToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield user_model_1.default.create({ username, email, password: hashedPassword });
        const token = createToken(user._id.toString());
        return res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, username: user.username, email: user.email },
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const passwordMatches = yield bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = createToken(user._id.toString());
        return res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, username: user.username, email: user.email },
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
});
exports.loginUser = loginUser;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = yield user_model_1.default.findById(req.user.userId).select('username email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load user', error });
    }
});
exports.getCurrentUser = getCurrentUser;
