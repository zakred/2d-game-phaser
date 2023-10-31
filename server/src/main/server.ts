import express from "express";
import http from "http";
import {Server} from "socket.io";
import {
    activeRooms,
    createRoom,
    getRoom,
    joinRoom,
    roomExists,
} from "./room.js";
import {hri} from "human-readable-ids";
import Player from "./player.js";
import Game from "./game.js";
import {GameStatePublishable} from "./game_state_publishable.js";
import {ActionType} from "./action_type.js";
import {PointPublishable} from "./point_publishable.js";
import {logger} from "./util/logger.js";
import Pathfinder from "./pathfinder.js";

const port = process.env.SERVER_PORT || 3000;
const cors_host = process.env.CORS_ALLOWED_FQDN || "http://localhost:8085";
const app = express();
const server = http.createServer(app);

const games = {};

const io = new Server(server, {
    cors: {origin: cors_host.split(",")},
});

io.on("connection", (socket) => {
    logger.info(
        `A user connected id: ${socket.id}  user-agent: ${socket.request.headers["user-agent"]}`,
    );
    const handleErrors = (fn) => {
        try {
            fn();
        } catch (e) {
            io.to(socket.id).emit(e.message);
        }
    };

    socket.on("createParty", (roomId) => {
        let id: string;
        for (let i = 0; i < 100; i++) {
            id = hri.random();
            if (!roomExists(id)) {
                break;
            }
        }

        createRoom(id, socket.id);
        socket.join(id);
        io.to(id).emit("partyCreated", id);
    });

    socket.on("joinParty", (roomId) => {
        if (joinRoom(roomId, socket.id)) {
            socket.join(roomId);
            io.to(roomId).emit("joinedParty", roomId, socket.id);
        }
    });

    socket.on("startGame", (roomId) => {
        if (games[roomId]) {
            io.to(roomId).emit("error", "game already started");
            return;
        }
        const room = getRoom(roomId);
        const player1 = new Player(room.playerOne.id, room.playerOne.id);
        const player2 = new Player(room.playerTwo.id, room.playerTwo.id);
        const pathfinder = new Pathfinder();
        const game = new Game(roomId, player1, pathfinder);
        game.setPlayer2(player2);
        game.start();
        const updateInterval = setInterval(() => {
            const st = game.getState();
            const player1Position = st.playersPosition[player1.getId()];
            const player2Position = st.playersPosition[player2.getId()];
            const gamePub: GameStatePublishable = {
                turn: st.turn,
                turnTimeRunning: game.getTurnTimeRunning(),
                player1Position: {
                    x: player1Position.getX(),
                    y: player1Position.getY(),
                },
                player2Position: {
                    x: player2Position.getX(),
                    y: player2Position.getY(),
                },
                player1IsAlive: player1.isAlive(),
                player2IsAlive: player2.isAlive(),
                platform1: st.platform1.getTiles(),
                platform2: st.platform2.getTiles(),
                status: st.status,
                actionsHistory: game.getPublishableActionsHistory(),
            };
            io.to(roomId).emit("gameState", gamePub);
        }, 1000);

        games[roomId] = {game: game, updateInterval: updateInterval};
        io.to(roomId).emit("gameStarted");
    });

    socket.on("movePlayer", (roomId: string, position: PointPublishable) => {
        handleErrors(() => {
            const game = games[roomId].game;
            logger.debug(socket.id, ActionType.MOVE, position);
            game.addAction(socket.id, ActionType.MOVE, position);
        });
    });

    socket.on("shootTarget", (roomId: string, position: PointPublishable) => {
        handleErrors(() => {
            const game = games[roomId].game;
            logger.debug(socket.id, ActionType.SHOOT, position);
            game.addAction(socket.id, ActionType.SHOOT, position);
        });
    });

    socket.on("disconnect", () => {
        logger.info("A user disconnected");
        const roomIndex = activeRooms.findIndex(
            (room) => room.playerOne.id === socket.id,
        );
        roomIndex >= 0 && activeRooms.splice(roomIndex, 1);
        logger.info("rooms: ", activeRooms);
    });
});

logger.info(`Server running on port: ${port}`);
io.listen(+port);
