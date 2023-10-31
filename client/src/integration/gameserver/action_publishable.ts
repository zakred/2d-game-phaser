import {ActionType} from "./action_type.js";

export interface ActionPublishable{
    turn: number,
    player: number,
    type: ActionType;
    value: any;
}