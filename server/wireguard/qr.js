import QRCode from 'qrcode';

export async function generateQrDataUrl(configString) {
  return QRCode.toDataURL(configString, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
}

export async function generateQrSvg(configString) {
  return QRCode.toString(configString, { type: 'svg' });
}
