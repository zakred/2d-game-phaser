import {GameStatus} from "./game_status.js";
import Platform from "./platform.js";
import Player from "./player.js";

export interface GameState{
    turn: number,
    status: GameStatus,
    platform1: Platform,
    platform2: Platform,
    player1: Player,
    player2: Player
    playersPosition: any
}