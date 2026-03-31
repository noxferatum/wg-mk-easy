export function generateClientConfig({ privateKey, address, dns, publicKey, endpoint, allowedIps }) {
  return `[Interface]
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${dns}

[Peer]
PublicKey = ${publicKey}
Endpoint = ${endpoint}
AllowedIPs = ${allowedIps}
PersistentKeepalive = 25`;
}
