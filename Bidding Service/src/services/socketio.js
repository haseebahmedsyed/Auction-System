const { Server } = require("socket.io");

class SocketIo {
    constructor() {
        if (SocketIo.instance)
            return this.instance;

        SocketIo.instance = this
    }
    initSocket(server) {
        this.io = new Server(server, {
            cors: {
                origin: ["http://localhost:8989"], // Restrict access to only this origin
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket) => {
            console.log(`User connected: ${socket.id}`);

            // Join a room
            socket.on("joinRoom", (roomName) => {
                socket.join(roomName);
                console.log(`${socket.id} joined room: ${roomName}`);
            });

            // Leave a room
            socket.on("leaveRoom", (roomName) => {
                socket.leave(roomName);
                console.log(`${socket.id} left room: ${roomName}`);
            });

            // Disconnect
            socket.on("disconnect", () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
    }

    braodcastAuctionMessage = (auction, message) => {
        this.io.to(auction).emit(auction,message)
    }
}

module.exports = new SocketIo();