// Client-side SHA-256 hashing using Web Crypto API
export async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Validate a guess against the answer hash
export async function validateGuess(guessId: string, answerHash: string): Promise<boolean> {
    const guessHash = await sha256(guessId);
    return guessHash === answerHash;
}
