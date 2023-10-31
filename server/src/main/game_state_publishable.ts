import {GameStatus} from "./game_status.js";
import {ActionPublishable} from "./action_publishable.js";
import {PointPublishable} from "./point_publishable.js";

export interface GameStatePublishable{
    turn: number,
    turnTimeRunning: number,
    status: GameStatus,
    platform1: Array<Array<boolean>>,
    platform2: Array<Array<boolean>>,
    player1Position: PointPublishable,
    player2Position: PointPublishable,
    player1IsAlive: boolean,
    player2IsAlive: boolean,
    actionsHistory: Array<ActionPublishable>
}