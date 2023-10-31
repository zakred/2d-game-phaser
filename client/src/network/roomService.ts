import {Socket} from "socket.io-client";
import GamePlayScene from "../scenes/gameplay";
import SocketConnector from "./socket";
import {PointPublishable} from "../integration/gameserver/point_publishable";

export default class RoomService {
    private socketConnection: SocketConnector;
    private roomId: string;
    private userId: string;
    private isHost: boolean;

    constructor(
        scene: GamePlayScene,
        connection: Socket,
        roomId: string,
        userId: string,
        isHost: boolean,
    ) {
        this.socketConnection = new SocketConnector(connection, scene);
        this.roomId = roomId;
        this.userId = userId;
        this.isHost = isHost;
    }

    getUserId() {
        return this.userId;
    }

    getRoomId() {
        return this.roomId;
    }

    IsHost() {
        return this.isHost;
    }

    sendMovePosition(x: number, y: number) {
        const position: PointPublishable = {x: x, y: y};
        this.socketConnection.sendMovePosition(this.roomId, position);
    }

    sendShootPosition(position: PointPublishable) {
        this.socketConnection.sendShootPosition(this.roomId, position);
    }

    startGame() {
        this.socketConnection.startGame(this.roomId);
    }
}
