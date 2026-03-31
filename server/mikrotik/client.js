export class MikroTikClient {
  constructor(host, user, pass) {
    this.baseUrl = `https://${host}/rest`;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${this.baseUrl}${path}`, options);
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const err = new Error(`RouterOS API error: ${res.status}`);
      err.status = res.status;
      err.detail = detail;
      throw err;
    }
    return res.json();
  }

  get(path) { return this.request('GET', path); }
  put(path, body) { return this.request('PUT', path, body); }
  patch(path, body) { return this.request('PATCH', path, body); }
  delete(path) { return this.request('DELETE', path); }
}
