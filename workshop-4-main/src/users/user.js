"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const config_1 = require("../config");
let lastReceivedMessage = null;
let lastSentMessage = null;
async function user(userId) {
    const _user = (0, express_1.default)();
    _user.use(express_1.default.json());
    _user.use(body_parser_1.default.json());
    // Status route
    _user.get("/status", (req, res) => {
        res.send("live");
    });
    // Get last received message
    _user.get("/getLastReceivedMessage", (req, res) => {
        res.json({ result: lastReceivedMessage });
    });
    // Get last sent message
    _user.get("/getLastSentMessage", (req, res) => {
        res.json({ result: lastSentMessage });
    });
    const server = _user.listen(config_1.BASE_USER_PORT + userId, () => {
        console.log(`User ${userId} is listening on port ${config_1.BASE_USER_PORT + userId}`);
    });
    return server;
}
exports.user = user;
