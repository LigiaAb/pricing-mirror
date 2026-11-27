const { socket_log } = require("../helpers/console_log");

const eventMiddleware = (socket, next) => {
  const { id } = socket;

  // Registra evento recibido
  socket.onAny((eventName, ...args) => {
    socket_log(`[${id}] Event received: ${eventName}`, ...args);
  });

  // Registra evento enviado
  const emit = socket.emit.bind(socket);
  socket.emit = function (eventName, ...args) {
    socket_log(`[${id}] Event sent: ${eventName}`, ...args);
    emit(eventName, ...args);
  };

  next();
};

module.exports = { eventMiddleware };
