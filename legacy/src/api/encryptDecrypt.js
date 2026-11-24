import CryptoJS from "crypto-js";

// Clave secreta
const SECRET_KEY = import.meta.env.VITE_ENCRIPT_KEY;

// Función para hacer el Base64 "URL-safe"
const makeUrlSafe = (base64String) => {
  return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); // No eliminamos '=' por completo
};

// Función para revertir el Base64 a su forma original (restaurando el padding si es necesario)
const revertUrlSafe = (urlSafeString) => {
  let base64String = urlSafeString.replace(/-/g, "+").replace(/_/g, "/");
  while (base64String.length % 4) {
    base64String += "="; // Restauramos los '=' si es necesario
  }
  return base64String;
};

export const encryptId = (id) => {
  // console.log("ID before encryption:", id); // Verificar el ID antes de encriptar
  const encrypted = CryptoJS.AES.encrypt(id.toString(), SECRET_KEY).toString();
  return makeUrlSafe(encrypted); // Convertir en formato seguro para URLs
};

// Desencriptar el ID a partir de la URL
export const decryptId = (encryptedId) => {
  try {
    const base64String = revertUrlSafe(encryptedId);
    const decrypted = CryptoJS.AES.decrypt(base64String, SECRET_KEY);
    const id = decrypted.toString(CryptoJS.enc.Utf8);

    if (!id) {
      throw new Error("Error during decryption");
    }

    return id; // Retorna el ID desencriptado
  } catch (error) {
    console.error("Failed to decrypt ID:", error);
    return null; // O maneja el error según lo necesites
  }
};
