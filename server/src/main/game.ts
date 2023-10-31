import {randomUUID} from "crypto";
import {GameStatus} from "./game_status.js";
import {GameState} from "./game_state.js";
import {ActionType} from "./action_type.js";
import Player from "./player.js";
import Point from "./point.js";
import Platform from "./platform.js";
import Task from "./util/task.js";
import * as errorUtil from "./util/error-util.js";
import {ActionPublishable} from "./action_publishable";
import Pathfinder from "./pathfinder";

class Game {
    private readonly pathfinder: Pathfinder
    private readonly id: string;
    private readonly taskRunner: any
    private readonly name: string;
    private readonly turnDuration: number
    private readonly platform1: Platform;
    private readonly platform2: Platform;
    private readonly platforms: any
    private readonly player1: Player;
    private task: Task
    private player2: Player;
    private playersPosition: any
    private state: GameState
    private turnActions: any
    private publishableActions: Array<ActionPublishable>

    constructor(name: string, player1: Player, pathfinder: Pathfinder, id : string = randomUUID(), turnDuration = 12500, taskRunner = Task) {
        this.id = id
        this.name = name
        this.turnDuration = turnDuration
        this.player1 = player1
        this.platform1 = new Platform(5, 3);
        this.platform2 = new Platform(5, 3);
        this.platforms = {}
        this.playersPosition = {}
        this.turnActions = {}
        this.taskRunner = taskRunner
        this.publishableActions = []
        this.pathfinder = pathfinder
        this.#setInitialState()
    }

    #setInitialState() {
        this.state = {
            turn: 1,
            status: GameStatus.WAITING_FOR_PLAYER2,
            platform1: this.platform1,
            platform2: this.platform2,
            playersPosition: this.playersPosition,
            player1: this.player1,
            player2: this.player2
        }
    }

    #ensurePlayerIdExists(playerId: string) {
        if (this.player1.getId() === playerId || this.player2.getId() === playerId) {
        } else {
            errorUtil.throwIntegrityError('Invalid player id');
        }
    }

    getPlayer(playerId: string) {
        if (this.player1.getId() === playerId){
            return this.player1
        } else if (this.player2.getId() === playerId) {
            return this.player2
        } else {
            errorUtil.throwIntegrityError('Player does not exist')
        }
    }

    getTurnDuration() {
        return this.turnDuration
    }

    getId() {
        return this.id
    }

    getName() {
        return this.name
    }

    getPlayerIds() {
        return {
            player1: this.player1.getId(),
            player2: this.player2 ? this.player2.getId() : undefined
        }
    }

    setPlayer2(player2: Player) {
        this.player2 = player2
        this.state.status = GameStatus.NOT_STARTED
    }

    start() {
        if (!this.player2){
            errorUtil.throwPlayer2Missing()
        }

        this.task = new this.taskRunner(() =>  {try{this.advanceTurn()}catch(e){console.error(e)}}, this.turnDuration)
        this.task.start()

        this.playersPosition[this.player1.getId()] = new Point(0, 4)
        this.playersPosition[this.player2.getId()] = new Point(2, 4)

        this.platforms[this.player1.getId()] = this.platform1
        this.platforms[this.player2.getId()] = this.platform2

        this.turnActions[this.player1.getId()] = {}
        this.turnActions[this.player2.getId()] = {}

        this.state.player1 = this.player1
        this.state.player2 = this.player2
        this.state.status = GameStatus.RUNNING
    }

    getState() : GameState {
        return {
            ...this.state
        }
    }

    advanceTurn() {

        // Don't do anything if game is over

        if (this.state.status === GameStatus.OVER) {
            return
        }

        // Advance turn

        this.state.turn++

        // Process actions for players

        for (const playerId in this.turnActions) {
            for (const type in this.turnActions[playerId]) {
                switch (+type) {
                    case ActionType.MOVE:
                        const payload = this.turnActions[playerId][type]
                        const newPosition = new Point(payload.x, payload.y)
                        this.playersPosition[playerId] = newPosition

                        const pubActionMove : ActionPublishable = {
                            player: this.player1.getId() === playerId ? 1 : 2,
                            turn: this.state.turn - 1,
                            type: +type,
                            value: payload
                        }
                        this.publishableActions.push(pubActionMove)
                        break;
                    case ActionType.SHOOT:
                        const shootPayload = this.turnActions[playerId][type]
                        const tileToShoot = new Point(shootPayload.x, shootPayload.y)
                        const enemyPlatform = this.getEnemyPlatform(playerId)
                        enemyPlatform.destroyTile(tileToShoot)

                        const pubActionShoot : ActionPublishable = {
                            player: this.player1.getId() === playerId ? 1 : 2,
                            turn: this.state.turn - 1,
                            type: +type,
                            value: shootPayload
                        }
                        this.publishableActions.push(pubActionShoot)
                        break;
                    default:
                        errorUtil.throwTypeNotSupported(type)
                }
            }
        }

        // Clear turn actions

        this.turnActions[this.player1.getId()] = {}
        this.turnActions[this.player2.getId()] = {}

        // Check if players were hit

        const player1Pos = this.playersPosition[this.player1.getId()]
        const player2Pos = this.playersPosition[this.player2.getId()]
        if (!this.platform1.isTilePresent(player1Pos)) {
            this.player1.shoot()
        }
        if (!this.platform2.isTilePresent(player2Pos)) {
            this.player2.shoot()
        }

        // Check if game is over

        if(!this.player1.isAlive() || !this.player2.isAlive()) {
            this.state.status = GameStatus.OVER
        }

    }

    addAction(playerId: string, type: ActionType, payload: any) {
        this.#ensurePlayerIdExists(playerId)
        if (!this.platform1.isTileWithinRange(new Point(payload.x, payload.y))){
            return
        }

        if (type === ActionType.MOVE) {
            const board = this.platforms[playerId].getTiles()
            const currentPosition = this.playersPosition[playerId]
            const isPathAvailable = this.pathfinder.isPathAvailable(board, currentPosition.getX(), currentPosition.getY(), payload.x, payload.y)
            if(!isPathAvailable){
                errorUtil.throwInvalidAction('MOVE', 'Path not available')
            }
        }

        // This will override any previous action of the same type with the new payload

        this.turnActions[playerId][type] = payload
    }

    getEnemyPlatform(playerId: string) {
        for (const id in this.platforms) {
            if (playerId !== id) {
                return this.platforms[id]
            }
        }
    }

    getTurnTimeRunning() {
        if (!this.task) {
            return 0
        }
        return this.task.getTimeRunning()
    }

    getPublishableActionsHistory() {
        return this.publishableActions
    }
}

export default Game