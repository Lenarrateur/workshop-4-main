import bodyParser from "body-parser";
import express from "express";
import crypto from "crypto";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";

let lastReceivedEncryptedMessage: string | null = null;
let lastReceivedDecryptedMessage: string | null = null;
let lastMessageDestination: number | null = null;

// Generate public/private key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const publicKeyString = publicKey.export({ type: "spki", format: "pem" }).toString();
const privateKeyString = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // Register the node to the registry using fetch
  fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
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

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
