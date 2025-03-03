"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symmetricDecrypt = exports.symmetricEncrypt = exports.importSymmetricKey = exports.exportSymmetricKey = exports.generateSymmetricKey = exports.rsaDecrypt = exports.rsaEncrypt = exports.importPrvKey = exports.exportPrvKey = exports.exportPubKey = exports.generateRsaKeyPair = void 0;
const crypto_1 = require("crypto");
const crypto = crypto_1.webcrypto; // Ensure compatibility with browser-like Web Crypto API
// #############
// ### Utils ###
// #############
// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
    return Buffer.from(buffer).toString("base64");
}
// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
    var buff = Buffer.from(base64, "base64");
    return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}
async function generateRsaKeyPair() {
    return crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"]);
}
exports.generateRsaKeyPair = generateRsaKeyPair;
async function exportPubKey(publicKey) {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
exports.exportPubKey = exportPubKey;
async function exportPrvKey(privateKey) {
    const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
exports.exportPrvKey = exportPrvKey;
async function importPrvKey(base64Key) {
    const binaryKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
}
exports.importPrvKey = importPrvKey;
async function rsaEncrypt(message, publicKey) {
    const key = await importPubKey(publicKey);
    const encrypted = await crypto.subtle.encrypt("RSA-OAEP", key, new TextEncoder().encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
exports.rsaEncrypt = rsaEncrypt;
async function rsaDecrypt(ciphertext, privateKey) {
    const decrypted = await crypto.subtle.decrypt("RSA-OAEP", privateKey, Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0)));
    return new TextDecoder().decode(decrypted);
}
exports.rsaDecrypt = rsaDecrypt;
// SYMMETRIC CRYPTO FUNCTIONS
async function generateSymmetricKey() {
    return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
exports.generateSymmetricKey = generateSymmetricKey;
async function exportSymmetricKey(key) {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
exports.exportSymmetricKey = exportSymmetricKey;
async function importSymmetricKey(base64Key) {
    const binaryKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", binaryKey, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
exports.importSymmetricKey = importSymmetricKey;
async function symmetricEncrypt(plaintext, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
    return { ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))), iv: btoa(String.fromCharCode(...iv)) };
}
exports.symmetricEncrypt = symmetricEncrypt;
async function symmetricDecrypt(ciphertext, iv, key) {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)) }, key, Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0)));
    return new TextDecoder().decode(decrypted);
}
exports.symmetricDecrypt = symmetricDecrypt;
