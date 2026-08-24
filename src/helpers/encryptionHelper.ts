import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export const encrypt = (data: any) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decrypt = (ciphertext: string | null) => {
  if (!ciphertext) return "";
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export function encryptRequest(obj: any) {
  const data = CryptoJS.AES.encrypt(JSON.stringify(obj), SECRET_KEY).toString();

  return { key: "web", data: data };
}

export function decryptResponse(data: { data: null; message: any }) {
  if (data.data !== null) {
    const bytes = CryptoJS.AES.decrypt(data.data, SECRET_KEY);
    try {
      const dataObj = {
        data: JSON.parse(bytes.toString(CryptoJS.enc.Utf8)),
        message: data.message,
      };
      return dataObj;
    } catch (error: any) {
      return data;
    }
  } else {
    return data;
  }
}
