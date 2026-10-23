const request = require('supertest');
const { io: Client } = require('socket.io-client');
const validation = require('../../libs/unalib');

// El servidor real usa esta misma instancia de una-lib al procesar el evento.
const validationSpy = jest.spyOn(validation, 'validateMessage');
const { app, http } = require('../../server');

let client;
let serverUrl;

function sendMessage(payload) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Tiempo de espera agotado esperando la respuesta del chat'));
    }, 3000);

    client.once('Evento-Mensaje-Server', (message) => {
      clearTimeout(timeout);
      resolve(JSON.parse(message));
    });

    client.emit('Evento-Mensaje-Server', JSON.stringify(payload));
  });
}

beforeAll(async () => {
  await new Promise((resolve) => http.listen(0, resolve));
  serverUrl = `http://127.0.0.1:${http.address().port}`;

  client = new Client(serverUrl, {
    transports: ['websocket'],
    forceNew: true
  });

  await new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
});

afterAll(async () => {
  if (client) client.close();
  if (http.listening) {
    await new Promise((resolve, reject) => http.close((error) => error ? reject(error) : resolve()));
  }
  validationSpy.mockRestore();
});

describe('integración del chat backend + una-lib', () => {
  beforeEach(() => validationSpy.mockClear());

  it('responde 200 en la ruta HTTP principal', async () => {
    await request(app)
      .get('/')
      .expect(200);
  });

  it('acepta una URL de imagen mediante el evento real de Socket.IO', async () => {
    const url = 'https://example.com/photo.png?size=large';
    const response = await sendMessage({ nombre: 'Ana', mensaje: url, color: '#123456' });

    expect(validationSpy).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({ mensaje: url, tipo: 'imagen', color: '#123456' });
  });

  it('acepta una URL de video y la clasifica para integrar el reproductor', async () => {
    const url = 'https://cdn.example.com/video.mp4';
    const response = await sendMessage({ nombre: 'Ana', mensaje: url });

    expect(validationSpy).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({ mensaje: url, tipo: 'video' });
  });

  it('acepta una URL de YouTube como video', async () => {
    const url = 'https://www.youtube.com/watch?v=qYwlqx-JLok';
    const response = await sendMessage({ mensaje: url });

    expect(response).toMatchObject({ mensaje: url, tipo: 'video' });
  });

  it('rechaza una URL no permitida', async () => {
    const response = await sendMessage({ mensaje: 'https://example.com/document.html' });

    expect(response.mensaje).toBe('');
    expect(response.tipo).toBe('texto');
  });

  it('sanea un intento de inyección de scripts', async () => {
    const response = await sendMessage({
      nombre: '<img src=x onerror=alert(1)>Usuario',
      mensaje: '<script>alert(document.cookie)</script><b>Mensaje seguro</b>'
    });

    expect(response.nombre).toBe('Usuario');
    expect(response.mensaje).toBe('Mensaje seguro');
    expect(response.mensaje).not.toMatch(/script|alert|onerror/i);
  });
});
