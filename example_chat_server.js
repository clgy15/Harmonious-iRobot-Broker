// for (var i = 0; i < 1000; i++) {
//
//   //socket.write(temp);
//   //socket.write('\r\n')
// }
//broadcast(socket.name + " joined the chat\n", socket);

// Handle incoming messages from clients.
// socket.on('data', function (data) {
//   broadcast(socket.name + "> " + data, socket);
// });
//
// // Remove the client from the list when it leaves
// socket.on('end', function () {
//   clients.splice(clients.indexOf(socket), 1);
//   broadcast(socket.name + " left the chat.\n");
// });
//
// // Send a message to all clients
// function broadcast(message, sender) {
//   clients.forEach(function (client) {
//     // Don't want to send it to sender
//     if (client === sender) return;
//     client.write(message);
//   });
//   // Log it to the server output too
//   process.stdout.write(message)
