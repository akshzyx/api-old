import { createCipher } from 'aes256';

const encryptionKey = process.env.ENCRYPTION_KEY;
const cipher = createCipher(encryptionKey);

export function encrypt(msg: string): string {
  return cipher.encrypt(msg);
}

export function decrypt(msg: string): string {
  return cipher.decrypt(msg);
}
