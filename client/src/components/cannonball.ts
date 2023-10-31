import * as Phaser from "phaser";
import GamePlayScene from "../scenes/gameplay";
import {WOOD_SPRITE_SIZE} from "./platform";

export default class Cannonball {
    private sceneRef: GamePlayScene;
    private targetPos: Phaser.Math.Vector2;

    constructor(scene: GamePlayScene) {
        this.sceneRef = scene;
        this.targetPos = new Phaser.Math.Vector2(0, 0);
    }

    shootTo(target: Phaser.Math.Vector2, origin: Phaser.Math.Vector2) {
        const cannonball = this.sceneRef.physics.add.sprite(
            origin.x,
            origin.y,
            "cannonball",
        );

        this.sceneRef.tweens.add({
            targets: cannonball,
            x: target.x,
            y: target.y,
            duration: 1000,
            onComplete: () => {
                cannonball.destroy();
            },
            onUpdate: () => {},
        });
    }
}
