import express from "express";
import http from "http";
import { Server } from "socket.io";
import {createRoom, joinRoom, activeRooms, roomExists} from "./room.js";
import { v4 as uuidv4 } from 'uuid';
import {hri} from 'human-readable-ids'

const port = process.env.SERVER_PORT || 3000;
const cors_host = process.env.CORS_ALLOWED_FQDN || "http://localhost:8085";
const app = express();
const server = http.createServer(app);

type PlayerPosition = {
  x: number;
  y: number;
};

const io = new Server(server, {
  cors: { origin: cors_host },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createParty", (roomId) => {
    // createRoom(roomId, socket.id);
    // socket.join(roomId);
    // io.to(roomId).emit("partyCreated", roomId, socket.id);

    // const id = uuidv4()
    let id
    for (let i = 0; i < 100; i++) {
      id = hri.random()
      if (!roomExists(id)) {
        break
      }
    }

    createRoom(id, socket.id);
    socket.join(id);
    io.to(id).emit("partyCreated", id, socket.id);
  });

  socket.on("joinParty", (roomId) => {
    if (joinRoom(roomId, socket.id)) {
      socket.join(roomId);
      io.to(roomId).emit("joinedParty", roomId, socket.id);
    }
  });

  socket.on("startGame", (roomId) => {
    io.to(roomId).emit("start", socket.id);
  });

  socket.on(
    "movePlayer",
    (roomId: string, userId: string, player: PlayerPosition) => {
      io.to(roomId).emit("updatePosition", userId, player);
    }
  );

  socket.on(
    "shootTarget",
    (roomId: string, userId: string, position: { x: number; y: number }) => {
      io.to(roomId).emit("setShootPosition", userId, position);
    }
  );

  socket.on("readyToShoot", (roomId: string, userId: string) => {
    const room = activeRooms.find((r) => r.id === roomId);
    if (room?.playerOne.id === userId) {
      room.playerOne.ready = true;
    }

    if (room?.playerTwo.id === userId) {
      room.playerTwo.ready = true;
    }

    if (room?.playerOne.ready && room?.playerTwo.ready) {
      room.playerOne.ready = false;
      room.playerTwo.ready = false;
      io.to(roomId).emit("shoot");
      io.to(roomId).emit("endTurn");
    }
  });

  socket.on("playerHit", (roomId: string, userId: string) => {
    io.to(roomId).emit("hit", userId);
  });

  socket.on(
    "playerCanMove",
    (roomId: string, userId: string, canMove: boolean) => {
      io.to(roomId).emit("readyToMove", userId, canMove);
    }
  );

  socket.on("startCount", (roomId: string) => {
    let count = 10;
    let countDownInterval = setInterval(() => {
      io.to(roomId).emit("count", count);
      count--;
      if (count === -1) {
        io.to(roomId).emit("playTurn");
      }

      if (count < -1) {
        clearInterval(countDownInterval);
      }
    }, 1000);
  });

  socket.on(
    "removeObject",
    (roomId: string, userId: string, x: number, y: number) => {
      io.to(roomId).emit("destroyObject", userId, x, y);
    }
  );

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    const roomIndex = activeRooms.findIndex(
      (room) => room.playerOne.id === socket.id
    );
    roomIndex >= 0 && activeRooms.splice(roomIndex, 1);
    console.log("rooms: ", activeRooms);
  });
});

console.log(`Server running on port: ${port}`);
io.listen(+port);
