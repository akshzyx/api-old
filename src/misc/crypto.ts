import CryptoJS from "crypto-js";

const encryptionSecret = process.env.ENCRYPTION_SECRET as string;

export function encrypt(msg: string): string {
  return msg;
  // return CryptoJS.AES.encrypt(msg, encryptionSecret).toString();
}

export function decrypt(msg: string): string {
  return msg;
  // return CryptoJS.AES.decrypt(msg, encryptionSecret).toString(
  //   CryptoJS.enc.Utf8
  // );
}
