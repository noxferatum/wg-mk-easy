import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    privateKey: encodeBase64(keyPair.secretKey),
    publicKey: encodeBase64(keyPair.publicKey),
  };
}
