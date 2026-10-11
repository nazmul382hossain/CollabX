// =====================================================================
// CollabX Security & Cryptography Utilities
// Secure password hashing with salt and SHA-256 verification
// =====================================================================

export const DEFAULT_SALT = 'c011abx_s41t_2026';

// Pre-computed hash of 'Password@123' with DEFAULT_SALT
export const DEFAULT_PASSWORD_HASH = 'sha256$c011abx_s41t_2026$c61747f38c42b7f449b75b4b016daba691d0fea13824bc9fd83be7f8471d4122';

/**
 * Generate a random cryptographically strong hex salt
 */
export function generateSalt(byteLength: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-browser environments
  let result = '';
  for (let i = 0; i < byteLength; i++) {
    result += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return result;
}

/**
 * Hash a password with salt using Web Crypto API SHA-256
 * Format: sha256$<salt>$<hex_digest>
 */
export async function hashPassword(password: string, salt: string = generateSalt()): Promise<string> {
  const message = `${salt}:${password}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256$${salt}$${hashHex}`;
  }

  // Fallback using pure JS SHA-256
  const hashHex = pureSha256(message);
  return `sha256$${salt}$${hashHex}`;
}

/**
 * Verify a submitted plaintext password against stored salted hash
 */
export async function verifyPassword(password: string, storedHash?: string, salt?: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // If hash is in format sha256$salt$hashHex
  if (storedHash.startsWith('sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const extractedSalt = parts[1];
      const expectedDigest = parts[2];
      const computed = await hashPassword(password, extractedSalt);
      const computedDigest = computed.split('$')[2];
      return computedDigest === expectedDigest;
    }
  }

  // Legacy Werkzeug / bcrypt demo placeholder fallback check
  // E.g., if stored as "$2y$12$eXAMPLEDemoHashedPassword..."
  if (storedHash.includes('eXAMPLEDemoHashedPassword')) {
    return password === 'Password@123';
  }

  // Fallback: verify with provided salt if separate
  if (salt) {
    const computed = await hashPassword(password, salt);
    return computed === storedHash || computed.endsWith(storedHash);
  }

  return false;
}

/**
 * Pure JavaScript SHA-256 implementation (RFC 6234 compliant)
 * Used as reliable fallback when Web Crypto subtle is unavailable
 */
function pureSha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let formatted = ascii + '\x80';
  while ((formatted.length % 64) - 56) formatted += '\x00';
  for (let i = 0; i < formatted.length; i++) {
    const j = formatted.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength | 0);

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = [...hash];
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (
        w[i] = (i < 16) ? (w[i] || 0) : (
          (w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1
        ) | 0
      )) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      const b = (hash[i] >> (8 * i2)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}
