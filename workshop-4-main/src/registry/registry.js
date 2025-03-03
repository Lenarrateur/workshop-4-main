"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchRegistry = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const crypto_1 = require("../crypto");
const config_1 = require("../config");
const nodes = [];
const privateKeys = new Map();
const userMessages = new Map(); // Store last received messages
async function createKeyPair() {
    const { publicKey, privateKey } = await (0, crypto_1.generateRsaKeyPair)();
    return {
        publicKey: await (0, crypto_1.exportPubKey)(publicKey),
        privateKey: await (0, crypto_1.exportPrvKey)(privateKey),
    };
}
async function launchRegistry() {
    const _registry = (0, express_1.default)();
    _registry.use(express_1.default.json());
    _registry.use(body_parser_1.default.json());
    _registry.get("/status", (req, res) => res.send("live"));
    _registry.post("/registerNode", (req, res) => {
        const { nodeId, pubKey } = req.body;
        if (nodeId === undefined || !pubKey)
            return res.status(400).json({ error: "nodeId and pubKey are required" });
        if (nodes.some((node) => node.nodeId === nodeId))
            return res.status(409).json({ error: "Node with this ID already exists" });
        nodes.push({ nodeId, pubKey });
        return res.status(201).json({ message: "Node registered", node: { nodeId, pubKey } });
    });
    _registry.get("/getNodeRegistry", (req, res) => res.json({ nodes }));
    _registry.get("/getPrivateKey", (req, res) => {
        const nodeId = Number(req.query.nodeId);
        const privateKey = privateKeys.get(nodeId);
        if (!privateKey)
            return res.status(404).json({ error: "Private key not found" });
        return res.json({ result: privateKey });
    });
    _registry.post("/initializeNodes", async (req, res) => {
        nodes.length = 0;
        privateKeys.clear();
        for (let nodeId = 0; nodeId < 10; nodeId++) {
            const { publicKey, privateKey } = await createKeyPair();
            nodes.push({ nodeId, pubKey: publicKey });
            privateKeys.set(nodeId, privateKey);
        }
        return res.status(201).json({ message: "10 nodes initialized", nodes });
    });
    // NEW MESSAGE ROUTES
    _registry.post("/message", (req, res) => {
        const { userId, message } = req.body;
        if (userId === undefined || !message)
            return res.status(400).json({ error: "userId and message are required" });
        userMessages.set(userId, message);
        return res.status(200).json({ message: "Message received" });
    });
    _registry.get("/getLastReceivedMessage", (req, res) => {
        const userId = Number(req.query.userId);
        return res.json({ result: userMessages.get(userId) ?? null });
    });
    const server = _registry.listen(config_1.REGISTRY_PORT, () => console.log(`Registry is listening on port ${config_1.REGISTRY_PORT}`));
    return server;
}
exports.launchRegistry = launchRegistry;
