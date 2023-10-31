import {randomUUID} from "crypto";

class Player {
    private readonly id: string;
    private readonly name: string;
    private alive: boolean;
    constructor(name: string, id: string = randomUUID()) {
        this.id = id;
        this.name = name;
        this.alive = true;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    isAlive() {
        return this.alive;
    }

    shoot() {
        this.alive = false;
    }
}

export default Player;
