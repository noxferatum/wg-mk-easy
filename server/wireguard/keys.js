import nacl from 'tweetnacl';
import pkg from 'tweetnacl-util';
const { encodeBase64 } = pkg;

export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    privateKey: encodeBase64(keyPair.secretKey),
    publicKey: encodeBase64(keyPair.publicKey),
  };
}
