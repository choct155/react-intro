export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join(''));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function registerBiometric(): Promise<string> {
  const challenge = randomBytes(32);
  const userId = randomBytes(16);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: 'Voice Todo',
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: 'user@voicetodo',
        displayName: 'Voice Todo User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    } as PublicKeyCredentialCreationOptions,
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error('Credential creation returned null');
  return toBase64(credential.rawId);
}

export async function authenticateBiometric(credentialIdBase64: string): Promise<boolean> {
  const challenge = randomBytes(32);
  const credId = fromBase64(credentialIdBase64);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: credId,
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    } as PublicKeyCredentialRequestOptions,
  });

  return assertion !== null;
}
