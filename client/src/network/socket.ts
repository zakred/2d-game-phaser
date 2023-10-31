import {Socket} from "socket.io-client";
import GamePlayScene from "../scenes/gameplay";
import {GameStatePublishable} from "../integration/gameserver/game_state_publishable";
import {GameStatus} from "../integration/gameserver/game_status";
import {PointPublishable} from "../integration/gameserver/point_publishable";
import {ActionType} from "../integration/gameserver/action_type";
import {ActionPublishable} from "../integration/gameserver/action_publishable";
import Platform, {boardPositionToUiPosition} from "../components/platform";

const WAIT_TIME_CANNONBALL_BEFORE_REMOVING_TILE = 300;
const WAIT_TIME_TO_DISPLAY_GAME_OVER = 2000;

function removeTileWithDelay(platform: Platform, uiPosition: PointPublishable) {
    setTimeout(() => {
        platform.removeElementAt(uiPosition.x, uiPosition.y);
    }, WAIT_TIME_CANNONBALL_BEFORE_REMOVING_TILE);
}

export default class SocketConnector {
    private socket: Socket;
    private sceneRef: GamePlayScene;
    private actionsPerformed: any;
    private prevTurn: number;
    private canShootBasedOnDelay: boolean = false;
    private canShootTimeout: any;
    private canDisplayGameOver: boolean = false;
    private canDisplayGameOverTimeout: any;

    constructor(connection: Socket, scene: GamePlayScene) {
        this.socket = connection;
        this.sceneRef = scene;
        this.actionsPerformed = {};
        this.setup();
    }

    getActionHash(action: ActionPublishable) {
        return this.getHash("" + action.turn + action.player + action.type);
    }

    getHash(input: string) {
        let hash = 0,
            i,
            chr;
        if (input.length === 0) return hash;
        for (i = 0; i < input.length; i++) {
            chr = input.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0;
        }
        return hash;
    }

    #setGameStarted() {
        this.sceneRef.ui.showStartButton(false);
        this.sceneRef.ui.updateText("Make your move");
        this.sceneRef.ui.destroyRoomNameText();
        this.sceneRef.pirate.setCanMove(true);
        this.sceneRef.enemy.setCanMove(true);
    }

    private setup() {
        this.socket.on("joinedParty", (userId: string) => {
            if (this.sceneRef.roomService.getUserId() !== userId) {
                this.sceneRef.spawnEnemyPirate();
                this.sceneRef.ui.updateText("Ready to start");
                this.sceneRef.ui.showStartButton(true);
            }
        });

        this.socket.on("gameStarted", (userId: string) => {
            this.#setGameStarted();
        });

        this.socket.on("gameState", (gameState: GameStatePublishable) => {
            const isHost = this.sceneRef.roomService.IsHost();
            if (gameState.status === GameStatus.RUNNING) {
                this.#setGameStarted();
            }
            if (gameState.status === GameStatus.OVER) {
                if (!this.canDisplayGameOverTimeout) {
                    this.canDisplayGameOverTimeout = setTimeout(() => {
                        this.canDisplayGameOver = true;
                    }, WAIT_TIME_TO_DISPLAY_GAME_OVER);
                }
                if (this.canDisplayGameOver) {
                    this.sceneRef.ui.updateText("Game Over");
                    this.sceneRef.ui.updateCount("");
                    this.sceneRef.ui.destroyCount();
                    let finalText = gameState.player1IsAlive
                        ? "Host wins!"
                        : "Guest wins!";
                    if (
                        !gameState.player1IsAlive &&
                        !gameState.player2IsAlive
                    ) {
                        finalText = "Draw!";
                    }
                    this.sceneRef.ui.updateFinalText(finalText);

                    // Kill players

                    const p1 = isHost
                        ? this.sceneRef.pirate
                        : this.sceneRef.enemy;
                    const p2 = isHost
                        ? this.sceneRef.enemy
                        : this.sceneRef.pirate;

                    if (!gameState.player1IsAlive) {
                        p1.destroy();
                    }
                    if (!gameState.player2IsAlive) {
                        p2.destroy();
                    }
                }
            }
            if (gameState.turnTimeRunning) {
                const secs = Math.round(gameState.turnTimeRunning / 1000);
                this.sceneRef.ui.updateCount("" + secs);
            }

            // Perform this when turn changes

            if (gameState.turn !== this.prevTurn) {
                // Clear targets once the new turn starts

                this.sceneRef.platformB.destroyTargetRectangle();
                this.sceneRef.platformA.destroyTargetRectangle();

                // Set waiting time for shooting if there are move actions

                clearTimeout(this.canShootTimeout);
                this.canShootBasedOnDelay = false;
                if (
                    gameState.actionsHistory.some(
                        (x) =>
                            x.turn + 1 === gameState.turn &&
                            x.type === ActionType.MOVE,
                    )
                ) {
                    this.canShootTimeout = setTimeout(() => {
                        this.canShootBasedOnDelay = true;
                    }, 1750);
                } else {
                    this.canShootBasedOnDelay = true;
                }

                this.prevTurn = gameState.turn;
            }

            for (let i = 0; i < gameState.actionsHistory.length; i++) {
                const action = gameState.actionsHistory[i];
                const hash = this.getActionHash(action);

                // Skip if this action has been processed already

                if (hash in this.actionsPerformed) {
                    continue;
                }

                // Skip this turn action if a moving animation is in progress

                const shouldShoot = () => {
                    if (gameState.turn !== action.turn + 1) {
                        return true;
                    }
                    return this.canShootBasedOnDelay;
                };

                if (action.type === ActionType.SHOOT && !shouldShoot()) {
                    continue;
                }

                this.actionsPerformed[hash] = action;

                if (this.sceneRef.roomService.IsHost()) {
                    if (action.player === 1) {
                        if (action.type === ActionType.MOVE) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                true,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.pirate.moveNow(uiPosition);
                        } else if (action.type === ActionType.SHOOT) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                false,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.pirate.shootNow(uiPosition);
                            removeTileWithDelay(
                                this.sceneRef.platformB,
                                uiPosition,
                            );
                            //this.sceneRef.platformB.removeTile(uiPosition.x, uiPosition.y)
                        }
                    } else if (action.player === 2) {
                        if (action.type === ActionType.MOVE) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                false,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.enemy.moveNow(uiPosition);
                        } else if (action.type === ActionType.SHOOT) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                true,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.enemy.shootNow(uiPosition);
                            removeTileWithDelay(
                                this.sceneRef.platformA,
                                uiPosition,
                            );
                        }
                    }
                } else {
                    if (action.player === 1) {
                        if (action.type === ActionType.MOVE) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                true,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.enemy.moveNow(uiPosition);
                        } else if (action.type === ActionType.SHOOT) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                false,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.enemy.shootNow(uiPosition);
                            removeTileWithDelay(
                                this.sceneRef.platformA,
                                uiPosition,
                            );
                        }
                    } else if (action.player === 2) {
                        if (action.type === ActionType.MOVE) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                false,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.pirate.moveNow(uiPosition);
                        } else if (action.type === ActionType.SHOOT) {
                            const uiPosition = boardPositionToUiPosition(
                                action.value.x,
                                action.value.y,
                                undefined,
                                true,
                            );
                            console.log(
                                "x   y :  ",
                                action.value.x,
                                action.value.y,
                            );
                            console.log("UI pos " + JSON.stringify(uiPosition));
                            this.sceneRef.pirate.shootNow(uiPosition);
                            removeTileWithDelay(
                                this.sceneRef.platformB,
                                uiPosition,
                            );
                        }
                    }
                }
            }
        });
    }

    sendMovePosition(roomId: string, position: PointPublishable) {
        this.socket.emit("movePlayer", roomId, position);
    }

    startGame(roomId: string) {
        this.socket.emit("startGame", roomId);
    }
    sendShootPosition(roomId: string, position: PointPublishable) {
        this.socket.emit("shootTarget", roomId, position);
    }
}
