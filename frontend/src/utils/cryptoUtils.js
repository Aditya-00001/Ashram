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


// 1. Generate a random AES key for a single group message
export const generateGroupMessageKey = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // Must be extractable so we can encrypt it for others
    ["encrypt", "decrypt"]
  );
};

// 2. Encrypt the Message Key using a Recipient's Public Key (RSA-OAEP or ECDH derive)
// Note: Since we use ECDH, we still derive a temporary shared secret to lock the envelope.
export const encryptKeyForRecipient = async (messageKey, myPrivateKey, theirPublicKey) => {
  const sharedSecret = await deriveSharedSecret(myPrivateKey, theirPublicKey);
  
  // Export the raw message key bytes
  const rawKey = await window.crypto.subtle.exportKey("raw", messageKey);
  
  // Encrypt the raw key bytes using the shared secret
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    sharedSecret,
    rawKey
  );

  return {
    encryptedKey: Array.from(new Uint8Array(encryptedKeyBuffer)),
    iv: Array.from(iv)
  };
};

export const decryptKeyBuffer = async (ciphertextArray, ivArray, sharedKey) => {
  const ciphertext = new Uint8Array(ciphertextArray);
  const iv = new Uint8Array(ivArray);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    sharedKey,
    ciphertext
  );
  
  return decryptedBuffer; // Return the raw ArrayBuffer
};

// =======================================================
// 🔐 CLIENT-SIDE VAULT WRAPPING (PBKDF2 + AES-GCM)
// =======================================================

export const wrapPrivateKey = async (privateKeyJWK, pinOrPassphrase) => {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pinOrPassphrase);
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const wrappingKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // High iteration count for cryptographic resilience
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  const jwkString = JSON.stringify(privateKeyJWK);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    wrappingKey,
    encoder.encode(jwkString)
  );
  
  return {
    escrowedPrivateKey: Array.from(new Uint8Array(encryptedBuffer)),
    escrowSalt: Array.from(salt),
    escrowIv: Array.from(iv)
  };
};

export const unwrapPrivateKey = async (encryptedKeyBlob, saltArray, ivArray, pinOrPassphrase) => {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pinOrPassphrase);
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  const salt = new Uint8Array(saltArray);
  const iv = new Uint8Array(ivArray);
  
  const wrappingKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  const ciphertext = new Uint8Array(encryptedKeyBlob);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    wrappingKey,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
};