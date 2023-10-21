import {GameStatus} from "./game_status.js";
import Point from "./point.js";
import {ActionPublishable} from "./action_publishable.js";

export interface GameStatePublishable{
    turn: number,
    turnTimeRunning: number,
    status: GameStatus,
    platform1: Array<Array<boolean>>,
    platform2: Array<Array<boolean>>,
    player1Position: Point,
    player2Position: Point
    actionsHistory: Array<ActionPublishable>
}