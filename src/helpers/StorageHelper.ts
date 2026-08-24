import { decrypt, encrypt } from './encryptionHelper';

export function setLocalStorageData(key: string, data: any) {
  const encryptData = encrypt(data);
  localStorage.setItem(key, encryptData);
}

export function getLocalStoragedata(key: string) {
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    try {
      const decryptedData = decrypt(data);
      return JSON.parse(decryptedData);
    } catch (decryptError) {
      return null;
    }
  }
}
