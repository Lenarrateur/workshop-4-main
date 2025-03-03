import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { generateRsaKeyPair, exportPubKey, exportPrvKey } from "../crypto";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };
export type RegisterNodeBody = { nodeId: number; pubKey: string };
export type GetNodeRegistryBody = { nodes: Node[] };

const nodes: Node[] = [];
const privateKeys: Map<number, string> = new Map();
const userMessages: Map<number, string> = new Map(); // Store last received messages

async function createKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await generateRsaKeyPair();
  const publicKeyBase64 = await exportPubKey(publicKey);
  const privateKeyBase64 = (await exportPrvKey(privateKey)) ?? ""; // Default to empty string

  return { publicKey: publicKeyBase64, privateKey: privateKeyBase64 };
}


export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  _registry.get("/status", (req, res) => res.send("live"));

  _registry.post("/registerNode", (req: Request, res: Response) => {
    const { nodeId, pubKey } = req.body as RegisterNodeBody;
    if (nodeId === undefined || !pubKey) return res.status(400).json({ error: "nodeId and pubKey are required" });
    if (nodes.some((node) => node.nodeId === nodeId)) return res.status(409).json({ error: "Node with this ID already exists" });

    nodes.push({ nodeId, pubKey });
    return res.status(201).json({ message: "Node registered", node: { nodeId, pubKey } });
  });

  _registry.get("/getNodeRegistry", (req: Request, res: Response) => res.json({ nodes }));

  _registry.get("/getPrivateKey", (req: Request, res: Response) => {
    const nodeId = Number(req.query.nodeId);
    const privateKey = privateKeys.get(nodeId);
    if (!privateKey) return res.status(404).json({ error: "Private key not found" });

    return res.json({ result: privateKey });
  });

  _registry.post("/initializeNodes", async (req: Request, res: Response) => {
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
  _registry.post("/message", (req: Request, res: Response) => {
    const { userId, message } = req.body as { userId: number; message: string };
    if (userId === undefined || !message) return res.status(400).json({ error: "userId and message are required" });

    userMessages.set(userId, message);
    return res.status(200).json({ message: "Message received" });
  });

  _registry.get("/getLastReceivedMessage", (req: Request, res: Response) => {
    const userId = Number(req.query.userId);
    return res.json({ result: userMessages.get(userId) ?? null });
  });

  const server = _registry.listen(REGISTRY_PORT, () => console.log(`Registry is listening on port ${REGISTRY_PORT}`));
  return server;
}
