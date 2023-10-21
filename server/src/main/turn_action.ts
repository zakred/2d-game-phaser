import {ActionType} from "./action_type.js";

class TurnAction {
    private readonly type: ActionType;
    private readonly value: any;
    constructor(type: ActionType, value: any) {
        this.type = type;
        this.value = value;
    }

}

export default TurnAction