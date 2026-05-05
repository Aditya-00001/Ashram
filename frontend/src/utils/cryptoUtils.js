/**
 * cryptoUtils.js
 * Native Web Crypto API implementation for End-to-End Encryption
 */

// 1. Generate an Elliptic Curve (ECDH) Key Pair for the user
export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable (we need to save the private key locally)
    ["deriveKey", "deriveBits"]
  );
};

// 2. Export a Public Key to JSON Web Key (JWK) format to send to MongoDB
export const exportPublicKey = async (key) => {
  return await window.crypto.subtle.exportKey("jwk", key);
};

// 3. Export a Private Key to JWK (To save in localStorage safely)
export const exportPrivateKey = async (key) => {
  return await window.crypto.subtle.exportKey("jwk", key);
};

// 4. Import a JWK Public Key (When fetching another user's key from the database)
export const importPublicKey = async (jwk) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
};

// 5. Import a JWK Private Key (When loading the user's own key from localStorage)
export const importPrivateKey = async (jwk) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
};

// 6. The Magic: Combine My Private Key + Their Public Key = Shared AES Key
export const deriveSharedSecret = async (myPrivateKey, theirPublicKey) => {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: theirPublicKey,
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false, // Don't allow exporting the shared secret!
    ["encrypt", "decrypt"]
  );
};

// 7. Encrypt a message using the Shared AES Key
export const encryptMessage = async (text, sharedKey) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Initialization Vector (IV) must be unique for every single message
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
  
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    sharedKey,
    data
  );

  // Return both the ciphertext and the IV (both are needed to decrypt)
  return {
    ciphertext: Array.from(new Uint8Array(cipherBuffer)),
    iv: Array.from(iv)
  };
};

// 8. Decrypt a message using the Shared AES Key
export const decryptMessage = async (ciphertextArray, ivArray, sharedKey) => {
  try {
    const ciphertext = new Uint8Array(ciphertextArray);
    const iv = new Uint8Array(ivArray);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      sharedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed! Keys may not match.", err);
    return "[Encrypted Message - Unreadable]";
  }
};