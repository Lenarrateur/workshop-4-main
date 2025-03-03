import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (!key) return null;
  const exported = await webcrypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  const publicKey = await importPubKey(strPublicKey);
  const encodedData = base64ToArrayBuffer(b64Data); // Ensure input is a buffer

  const encryptedBuffer = await webcrypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedData
  );

  return arrayBufferToBase64(encryptedBuffer);
}

export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  const encryptedBuffer = base64ToArrayBuffer(data); // Convert back to buffer

  const decryptedBuffer = await webcrypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );

  return arrayBufferToBase64(decryptedBuffer); // Convert back to base64
}


// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.generateKey(
    {
      name: "AES-CBC", // Use AES-CBC instead of AES-GCM
      length: 256,
    },
    true, // Extractable
    ["encrypt", "decrypt"] // Ensure encryption & decryption usage
  );
}



// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

// Import a base64 string format to its crypto native format
export async function importSymKey(strKey: string): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(strKey),
    { name: "AES-CBC" }, // Ensure it matches encryption
    true,
    ["encrypt", "decrypt"] // Both encrypt & decrypt permissions
  );
}


// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  const iv = webcrypto.getRandomValues(new Uint8Array(16)); // AES-CBC needs 16-byte IV

  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-CBC", iv }, // Use AES-CBC mode
    key,
    new TextEncoder().encode(data)
  );

  return JSON.stringify({
    iv: arrayBufferToBase64(iv), // Store IV with ciphertext
    data: arrayBufferToBase64(encrypted),
  });
}

export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  const key = await importSymKey(strKey); // Ensure correct key import

  const { iv, data } = JSON.parse(encryptedData); // Extract IV and data

  const decrypted = await webcrypto.subtle.decrypt(
    { name: "AES-CBC", iv: base64ToArrayBuffer(iv) }, // Convert IV correctly
    key,
    base64ToArrayBuffer(data) // Convert data back to buffer
  );

  return new TextDecoder().decode(decrypted);
}
