import aes256 from "aes256";

const encryptionKey = process.env.ENCRYPTION_KEY;
const cipher = aes256.createCipher(encryptionKey);

export function encrypt(msg: string): string {
  return cipher.encrypt(msg);
}

export function decrypt(msg: string): string {
  return cipher.decrypt(msg);
}
