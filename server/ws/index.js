export async function wsRoutes(app) {
  const polling = app.polling;

  app.get('/ws', { websocket: true }, (socket) => {
    const send = (data) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ type: 'peers', data }));
      }
    };
    polling.addListener(send);
    socket.on('close', () => polling.removeListener(send));
  });
}
