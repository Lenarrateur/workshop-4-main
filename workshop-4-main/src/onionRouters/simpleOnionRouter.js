"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleOnionRouter = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
let lastReceivedEncryptedMessage = null;
let lastReceivedDecryptedMessage = null;
let lastMessageDestination = null;
// Generate public/private key pair
const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync("rsa", {
    modulusLength: 2048,
});
const publicKeyString = publicKey.export({ type: "spki", format: "pem" }).toString();
const privateKeyString = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
async function simpleOnionRouter(nodeId) {
    const onionRouter = (0, express_1.default)();
    onionRouter.use(express_1.default.json());
    onionRouter.use(body_parser_1.default.json());
    // Register the node to the registry using fetch
    fetch(`http://localhost:${config_1.REGISTRY_PORT}/registerNode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nodeId,
            pubKey: publicKeyString,
        }),
    })
        .then((res) => {
        if (!res.ok) {
            throw new Error(`Failed to register node ${nodeId}`);
        }
        console.log(`Node ${nodeId} registered successfully`);
    })
        .catch((err) => console.error(`Error registering node ${nodeId}:`, err));
    // Status route
    onionRouter.get("/status", (req, res) => {
        res.send("live");
    });
    // Get last received encrypted message
    onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
        res.json({ result: lastReceivedEncryptedMessage });
    });
    // Get last received decrypted message
    onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
        res.json({ result: lastReceivedDecryptedMessage });
    });
    // Get last message destination
    onionRouter.get("/getLastMessageDestination", (req, res) => {
        res.json({ result: lastMessageDestination });
    });
    // Get the private key (for testing purposes)
    onionRouter.get("/getPrivateKey", (req, res) => {
        res.json({ result: privateKeyString });
    });
    const server = onionRouter.listen(config_1.BASE_ONION_ROUTER_PORT + nodeId, () => {
        console.log(`Onion router ${nodeId} is listening on port ${config_1.BASE_ONION_ROUTER_PORT + nodeId}`);
    });
    return server;
}
exports.simpleOnionRouter = simpleOnionRouter;
