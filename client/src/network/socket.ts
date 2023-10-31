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
    platform.removeElementAt(uiPosition.x, uiPosition.y)
  }, WAIT_TIME_CANNONBALL_BEFORE_REMOVING_TILE)
}

export default class SocketConnector {
  private socket: Socket;
  private sceneRef: GamePlayScene;
  private actionsPerformed: any
  private prevTurn: number
  private canShootBasedOnDelay: boolean = false
  private canShootTimeout: any
  private canDisplayGameOver: boolean = false
  private canDisplayGameOverTimeout: any

  constructor(connection: Socket, scene: GamePlayScene) {
    this.socket = connection;
    this.sceneRef = scene;
    this.actionsPerformed = {}
    this.setup();
  }

  getActionHash(action : ActionPublishable) {
    return this.getHash('' + action.turn + action.player + action.type)
  }

  getHash(input: string) {
    let hash = 0,
        i, chr;
    if (input.length === 0) return hash;
    for (i = 0; i < input.length; i++) {
      chr = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  #setGameStarted() {
    this.sceneRef.ui.showStartButton(false);
    this.sceneRef.ui.updateText("Make your move");
    this.sceneRef.ui.destroyRoomNameText()
    this.sceneRef.pirate.setCanMove(true);
    this.sceneRef.enemy.setCanMove(true);
  }

  #sortActions(actions: any[]) {
    const copy = [...actions]
    const cmp = function(a, b) {
      if (a > b) return +1;
      if (a < b) return -1;
      return 0;
    }
    copy.sort(function(a, b) {
      return cmp(a.turn,b.turn) || cmp(a.type,b.type)
    })
    return copy
  }

  private setup() {
    this.socket.on("joinedParty", (userId: string) => {
      if (this.sceneRef.roomService.getUserId() !== userId) {
        this.sceneRef.spawnEnemyPirate();
        this.sceneRef.ui.updateText("Ready to start");
        this.sceneRef.ui.showStartButton(true);
        // this.sceneRef.pirate.setCanMove(true);
        // this.sceneRef.enemy.setCanMove(true);
      }
    });

    this.socket.on("gameStarted", (userId: string) => {
      this.#setGameStarted()
    });

    this.socket.on("gameState", (gameState: GameStatePublishable) => {
      const isHost = this.sceneRef.roomService.IsHost()
      if (gameState.status === GameStatus.RUNNING) {
        this.#setGameStarted()
      }
      if (gameState.status === GameStatus.OVER) {
        if (!this.canDisplayGameOverTimeout) {
          this.canDisplayGameOverTimeout = setTimeout(() => {
            this.canDisplayGameOver = true
          }, WAIT_TIME_TO_DISPLAY_GAME_OVER)
        }
        if (this.canDisplayGameOver) {
          this.sceneRef.ui.updateText("Game Over");
          this.sceneRef.ui.updateCount("");
          this.sceneRef.ui.destroyCount()
          let finalText = gameState.player1IsAlive ? 'Host wins!' : 'Guest wins!'
          if (!gameState.player1IsAlive && !gameState.player2IsAlive) {
            finalText = 'Draw!'
          }
          this.sceneRef.ui.updateFinalText(finalText)

          // Kill players

          const p1 = isHost ? this.sceneRef.pirate : this.sceneRef.enemy
          const p2 = isHost ? this.sceneRef.enemy : this.sceneRef.pirate

          if (!gameState.player1IsAlive) {
            p1.destroy()
          }
          if (!gameState.player2IsAlive) {
            p2.destroy()
          }
        }
      }
      if (gameState.turnTimeRunning) {
        const secs = Math.round(gameState.turnTimeRunning / 1000)
        this.sceneRef.ui.updateCount('' + secs);
      }

      // Perform this when turn changes

      if (gameState.turn !== this.prevTurn) {

        // Clear targets once the new turn starts

        this.sceneRef.platformB.destroyTargetRectangle()
        this.sceneRef.platformA.destroyTargetRectangle()

        // Set waiting time for shooting if there are move actions

        clearTimeout(this.canShootTimeout)
        this.canShootBasedOnDelay = false
        if (gameState.actionsHistory.some(x => x.turn + 1 === gameState.turn && x.type === ActionType.MOVE)) {
          this.canShootTimeout = setTimeout(() => {
            this.canShootBasedOnDelay = true
          }, 1750)
        } else {
          this.canShootBasedOnDelay = true
        }

        this.prevTurn = gameState.turn
      }

      for (let i = 0; i < gameState.actionsHistory.length; i++) {
        const action = gameState.actionsHistory[i]
        const hash = this.getActionHash(action)

        // Skip if this action has been processed already

        if (hash in this.actionsPerformed) {
          continue
        }

        // Skip this turn action if a moving animation is in progress

        // const isCurrentBoardPosition = (current: Vector2, targetX: number, targetY: number, isLeft: boolean) =>{
        //   const currentBoard = uiPositionToBoardPosition(current.x + WOOD_SPRITE_SIZE / 2, current.y, undefined, isLeft)
        //   console.log(`current board ${JSON.stringify(currentBoard)}`)
        //   return currentBoard.x === targetX && currentBoard.y === targetY;
        //
        // }

        const shouldShoot = () => {
          // const myPosition = isHost ? gameState.player1Position : gameState.player2Position
          // const enemyPosition = isHost ? gameState.player2Position : gameState.player1Position
          // console.log(`my position ${JSON.stringify(myPosition)}`)
          // console.log(`enemy position ${JSON.stringify(enemyPosition)}`)

          if (gameState.turn !== action.turn + 1) {
            return true
          }
          if (!this.canShootBasedOnDelay) {
            return false
          }
          // if (!isCurrentBoardPosition(this.sceneRef.pirate.getPosition(), myPosition.x, myPosition.y, isHost)) {
          //   return false
          // }
          // if (!isCurrentBoardPosition(this.sceneRef.enemy.getPosition(), enemyPosition.x, enemyPosition.y, !isHost)) {
          //   return false
          // }
          return true
        }

        if (action.type === ActionType.SHOOT && !shouldShoot()) {
          continue
        }

        // clearTimeout(this.canShootTimeout)
        // this.canShootTimeout = undefined
        // this.canShootBasedOnDelay = false

        this.actionsPerformed[hash] = action

        if (this.sceneRef.roomService.IsHost()) {
          if (action.player === 1) {
            if (action.type === ActionType.MOVE){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, true)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.pirate.moveNow(uiPosition)
            }
            else if (action.type === ActionType.SHOOT){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, false)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.pirate.shootNow(uiPosition)
              removeTileWithDelay(this.sceneRef.platformB, uiPosition)
              //this.sceneRef.platformB.removeTile(uiPosition.x, uiPosition.y)
            }
          }
          else if (action.player === 2) {
            if (action.type === ActionType.MOVE){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, false)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.enemy.moveNow(uiPosition)
            }
            else if (action.type === ActionType.SHOOT){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, true)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.enemy.shootNow(uiPosition)
              removeTileWithDelay(this.sceneRef.platformA, uiPosition)
            }
          }
        } else {
          if (action.player === 1) {
            if (action.type === ActionType.MOVE){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, true)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.enemy.moveNow(uiPosition)
            }
            else if (action.type === ActionType.SHOOT){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, false)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.enemy.shootNow(uiPosition)
              removeTileWithDelay(this.sceneRef.platformA, uiPosition)
            }
          }
          else if (action.player === 2) {
            if (action.type === ActionType.MOVE){
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, false)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.pirate.moveNow(uiPosition)
            }
            else if (action.type === ActionType.SHOOT){
              console.log('triggered for no reason2')
              const uiPosition = boardPositionToUiPosition(action.value.x, action.value.y, undefined, true)
              console.log('x   y :  ', action.value.x, action.value.y)
              console.log('UI pos ' + JSON.stringify(uiPosition))
              this.sceneRef.pirate.shootNow(uiPosition)
              removeTileWithDelay(this.sceneRef.platformB, uiPosition)
            }
          }
        }


      }


    });
    //
    // this.socket.on(
    //   "updatePosition",
    //   (userId: string, position: { x: number; y: number }) => {
    //     if (this.sceneRef.roomService.getUserId() !== userId) {
    //       this.sceneRef.enemy.setMovePosition(position.x, position.y);
    //       this.sceneRef.enemy.findPath();
    //     }
    //   }
    // );
    //
    // this.socket.on("readyToMove", (userId: string, canMove: boolean) => {
    //   if (this.sceneRef.roomService.getUserId() !== userId) {
    //     this.sceneRef.enemy.setCanMove(canMove);
    //   }
    // });
    //
    // this.socket.on("destroyObject", (userId: string, x: number, y: number) => {
    //   if (this.sceneRef.roomService.getUserId() !== userId) {
    //     this.sceneRef.platformA.removeElementAt(x, y);
    //   }
    // });
    //
    // this.socket.on("count", (count: number) => {
    //   this.sceneRef.ui.destroyRoomNameText()
    //   if (this.sceneRef.roomService.IsHost()) {
    //     count > 0 && this.sceneRef.ui.updateCount(count.toString());
    //     if (count === 0) {
    //       this.sceneRef.ui.updateCount("");
    //       const movePos = this.sceneRef.pirate.getMovePosition();
    //       this.sceneRef.pirate.setMovePosition(movePos.x, movePos.y);
    //       this.sceneRef.pirate.findPath();
    //       this.sceneRef.roomService.sendMovePosition(movePos.x, movePos.y);
    //       this.timer = setTimeout(() => {
    //         !this.sceneRef.gameOver && this.sceneRef.roomService.startTurn();
    //       }, 3000);
    //     }
    //   } else {
    //     count > 0 && this.sceneRef.ui.updateCount(count.toString());
    //     if (count === 0) {
    //       this.sceneRef.ui.updateCount("");
    //       const movePos = this.sceneRef.pirate.getMovePosition();
    //       this.sceneRef.pirate.setMovePosition(movePos.x, movePos.y);
    //       this.sceneRef.pirate.findPath();
    //       this.sceneRef.roomService.sendMovePosition(movePos.x, movePos.y);
    //       this.timer = setTimeout(() => {
    //         !this.sceneRef.gameOver && this.sceneRef.roomService.startTurn();
    //       }, 3000);
    //     }
    //   }
    // });
    //
    // this.socket.on("playTurn", () => {
    //   this.sceneRef.pirate.setCanMove(true);
    //   this.sceneRef.enemy.setCanMove(true);
    // });
    //
    // this.socket.on("endTurn", () => {
    //   this.sceneRef.pirate.setCanMove(false);
    //   this.sceneRef.enemy.setCanMove(false);
    // });
    //
    // this.socket.on(
    //   "setShootPosition",
    //   (userId: string, target: Phaser.Math.Vector2) => {
    //     if (this.sceneRef.roomService.getUserId() !== userId) {
    //       this.sceneRef.enemy.setTargetPosition(target);
    //     }
    //   }
    // );
    //
    // this.socket.on("shoot", () => {
    //   this.sceneRef.pirate.shoot();
    //   this.sceneRef.enemy.shoot();
    // });
    //
    // this.socket.on("hit", (userId: string) => {
    //   if (this.sceneRef.roomService.getUserId() !== userId) {
    //     this.sceneRef.pirate.destroy();
    //   }
    //   this.sceneRef.gameOver = true;
    //   clearTimeout(this.timer);
    //   this.sceneRef.ui.updateText("Game Over");
    //   this.sceneRef.ui.updateCount("");
    // });

    // this.socket.on("start", (userId: string) => {
    //   if (this.sceneRef.roomService.getUserId() === userId) {
    //     this.sceneRef.ui.showStartButton(false);
    //     //this.sceneRef.roomService.startTurn();
    //   }
    //
    //   this.sceneRef.ui.updateText("Make your move");
    // });
  }

  // sendMovePosition(roomId: string, userId: string, x: number, y: number) {
  //   this.socket.emit("movePlayer", roomId, userId, { x, y });
  // }

  sendMovePosition(roomId: string, position: PointPublishable) {
    this.socket.emit("movePlayer", roomId, position);
  }

  // sendPlayerCanMove(roomId: string, userId: string, canMove: boolean) {
  //   this.socket.emit("playerCanMove", roomId, userId, canMove);
  // }

  // startCount(roomId: string) {
  //   this.socket.emit("startCount", roomId);
  // }

  startGame(roomId: string) {
    this.socket.emit("startGame", roomId);
  }

  // sendShootPosition(
  //   roomId: string,
  //   userId: string,
  //   target: Phaser.Math.Vector2
  // ) {
  //   this.socket.emit("shootTarget", roomId, userId, target);
  // }

  sendShootPosition(
      roomId: string,
      position: PointPublishable
  ) {
    this.socket.emit("shootTarget", roomId, position);
  }
  //
  // sendReadyToShoot(roomId: string, userId: string) {
  //   this.socket.emit("readyToShoot", roomId, userId);
  // }
  //
  // sendTriggerCannon(
  //   roomId: string,
  //   userId: string,
  //   origin: Phaser.Math.Vector2
  // ) {
  //   this.socket.emit("triggerCannon", roomId, userId, origin);
  // }
  //
  // sendPlayerHit(roomId: string, userId: string) {
  //   this.socket.emit("playerHit", roomId, userId);
  // }

  // removeObject(roomId: string, userId: string, x: number, y: number) {
  //   this.socket.emit("removeObject", roomId, userId, x, y);
  // }
}
