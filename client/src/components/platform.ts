import * as Phaser from "phaser";
import GamePlayScene from "../scenes/gameplay";
import {PointPublishable} from "../integration/gameserver/point_publishable";

export const DISTANCE_BETWEEN_PLATFORMS = 13
export const PLATFORM_HEIGHT = 6;
export const PLATFORM_WIDTH = 4;
export const WOOD_SPRITE_SIZE = 64;
export const LEFT_PLATFORM_POS = { x: 0, y: WOOD_SPRITE_SIZE * 3 };
export const RIGHT_PLATFORM_POS = {
  x: WOOD_SPRITE_SIZE * DISTANCE_BETWEEN_PLATFORMS,
  y: WOOD_SPRITE_SIZE * 3,
};

const BOARD_INVERSE_MAPPING = {
  5: 0,
  4: 1,
  3: 2,
  2: 3,
  1: 4
}

const FROM_BOARD_TO_UI_INVERSE_MAPPING = {
  0: 5,
  1: 4,
  2: 3,
  3: 2,
  4: 1
}

export const uiPositionToBoardPosition = (x, y, enemy, isLeft) : PointPublishable  => {
  let boardX = x
  let boardY = y

  if(isLeft) {
    boardX = boardX - LEFT_PLATFORM_POS.x
    boardY = boardY - LEFT_PLATFORM_POS.y
  } else {
    boardX = boardX - RIGHT_PLATFORM_POS.x
    boardY = boardY - RIGHT_PLATFORM_POS.y
  }

  boardX = (boardX / WOOD_SPRITE_SIZE) - 1
  boardY = BOARD_INVERSE_MAPPING[boardY / WOOD_SPRITE_SIZE]

  // if (isLeft && enemy) {
  //   boardX = boardX - DISTANCE_BETWEEN_PLATFORMS
  // }

  return {
    x: boardX,
    y: boardY
  }
}

export const boardPositionToUiPosition = (x, y, enemy, isLeft) : PointPublishable => {
  let boardX = x
  let boardY = y

  boardX = (boardX + 1) * WOOD_SPRITE_SIZE
  boardY = FROM_BOARD_TO_UI_INVERSE_MAPPING[boardY]  * WOOD_SPRITE_SIZE

  if(isLeft) {
    boardX = boardX + LEFT_PLATFORM_POS.x
    boardY = boardY + LEFT_PLATFORM_POS.y
  } else {
    boardX = boardX + RIGHT_PLATFORM_POS.x
    boardY = boardY + RIGHT_PLATFORM_POS.y
  }

  // Doing this for positioning???

  boardY = boardY - (WOOD_SPRITE_SIZE / 2)

  return {
    x: boardX,
    y: boardY
  }
}

export default class Platform {
  private sceneRef: GamePlayScene;
  private platformBlocks: Phaser.Physics.Arcade.StaticGroup;
  private readonly x: number
  private readonly y: number
  private readonly isLeft: boolean
  private targetRectangle: Phaser.GameObjects.Rectangle

  constructor(
    scene: GamePlayScene,
    isLeft: boolean,
    enemy: boolean = false
  ) {
    this.sceneRef = scene;
    this.isLeft = isLeft;
    if (isLeft) {
      this.x = LEFT_PLATFORM_POS.x
      this.y = LEFT_PLATFORM_POS.y
    } else{
      this.x = RIGHT_PLATFORM_POS.x
      this.y = RIGHT_PLATFORM_POS.y
    }

    this.platformBlocks = scene.physics.add.staticGroup();
    for (let i = 1; i < PLATFORM_HEIGHT; i++) {
      const posY = i * WOOD_SPRITE_SIZE + this.y;
      for (let j = 1; j < PLATFORM_WIDTH; j++) {
        const posX = j * WOOD_SPRITE_SIZE + this.x;
        this.createPlatformBlock(posX, posY, enemy);
      }
    }
  }

  // #positionToBoardPosition(x, y, enemy, isLeft) : PointPublishable {
  //   let boardX = x
  //   let boardY = y
  //
  //   if(isLeft) {
  //     boardX = boardX - LEFT_PLATFORM_POS.x
  //     boardY = boardY - LEFT_PLATFORM_POS.y
  //   } else {
  //     boardX = boardX - RIGHT_PLATFORM_POS.x
  //     boardY = boardY - RIGHT_PLATFORM_POS.y
  //   }
  //
  //   boardX = (boardX / WOOD_SPRITE_SIZE) - 1
  //   boardY = BOARD_INVERSE_MAPPING[boardY / WOOD_SPRITE_SIZE]
  //
  //   // if (isLeft && enemy) {
  //   //   boardX = boardX - DISTANCE_BETWEEN_PLATFORMS
  //   // }
  //
  //   return {
  //     x: boardX,
  //     y: boardY
  //   }
  // }

  private createPlatformBlock(x: number, y: number, enemy: boolean) {
    const block = this.sceneRef.add.sprite(x, y, "wood");
    block.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, block.width, block.height),
      Phaser.Geom.Rectangle.Contains
    );

    this.addPlayerControl(block, x, y, enemy);

    this.platformBlocks.add(block);
  }

  private addPlayerControl = (
    block: Phaser.GameObjects.Sprite,
    x: number,
    y: number,
    enemy: boolean
  ): void => {
    block.on("pointerover", () => {
      const rect = this.sceneRef.add.rectangle(
        x,
        y,
        block.width,
        block.height,
        !enemy ? 0 : 23252,
        0.2
      );
      rect.setName("hover");
    });
    block.on("pointerout", () => {
      this.sceneRef.children.getByName("hover")?.destroy();
    });
    block.on("pointerdown", async () => {
      if (this.sceneRef.input.activePointer.middleButtonDown()) {
        console.log(this.sceneRef.input.mousePointer.position)
      }
      if (!enemy && this.sceneRef.input.activePointer.leftButtonDown()) {
        const uiX = x
        const uiY = y - WOOD_SPRITE_SIZE / 2
        // this.sceneRef.pirate?.setMovePosition(x, uiY);
        // this.sceneRef.pirate?.findPath();
        // this.sceneRef.pirate?.setCanMove(true);
        // this.sceneRef.update()
        // this.platformBlocks.getChildren().forEach(ch => {
        //   console.log(JSON.stringify(ch))
        // })

        //this.sceneRef.physics

        const boardPosition = uiPositionToBoardPosition(x, y, enemy, this.isLeft)
        this.sceneRef.roomService.sendMovePosition(boardPosition.x, boardPosition.y);

        if (process.env.NODE_ENV === 'development') {
          console.log('selected BOARD x y: ' + boardPosition.x + ' ' + boardPosition.y)
          const trPos = boardPositionToUiPosition(boardPosition.x, boardPosition.y, 'dummy', this.isLeft)
          console.log('selected UI ORIGINAL x y: ' + uiX + ' ' + uiY)
          console.log('selected TRANSFORMED x y: ' + trPos.x + ' ' + trPos.y)
        }


        const selectRect = this.sceneRef.add.rectangle(
          x,
          y,
          block.width,
          block.height,
          12123,
          0.5
        );

        this.sceneRef.children
          .getChildren()
          .forEach((child) => child.name === "selected" && child.destroy());
        selectRect.setName("selected");
      }

      if (enemy && this.sceneRef.input.activePointer.rightButtonDown()) {
        const newPos = new Phaser.Math.Vector2(x, y);
        //this.sceneRef.pirate.setTargetPosition(newPos);
        //this.sceneRef.pirate.shoot()
        //this.sceneRef.roomService.sendShootPosition(newPos);
        const boardPosition = uiPositionToBoardPosition(x, y, enemy, this.isLeft)
        this.sceneRef.roomService.sendShootPosition(boardPosition);

        if (process.env.NODE_ENV === 'development') {
          console.log('selected BOARD x y: ' + boardPosition.x + ' ' + boardPosition.y)
          const trPos = boardPositionToUiPosition(boardPosition.x, boardPosition.y, 'dummy', this.isLeft)
          console.log('selected PHASER VECT x y: ' + newPos.x + ' ' + newPos.y)
          console.log('selected UI ORIGINAL x y: ' + x + ' ' + y)
          console.log('selected TRANSFORMED x y: ' + trPos.x + ' ' + trPos.y)
        }

        this.targetRectangle = this.sceneRef.add.rectangle(
          x,
          y,
          block.width,
          block.height,
          34345,
          0.5
        );
        this.sceneRef.children
          .getChildren()
          .forEach((child) => child.name === "targetSelect" && child.destroy());
        this.targetRectangle.setName("targetSelect");
      }
    });
  };

  getBlocks() {
    return this.platformBlocks;
  }

  destroyTargetRectangle() {
    if (this.targetRectangle) {
      this.targetRectangle.destroy()
    }
  }

  removeTile(x, y) {
    // console.log(`remove TILE: ${x} ${y}`)
    // const block = this.platformBlocks.get(x, y);
    // console.log(block)
    // // this.platformBlocks.
    // block.destroy()

        // const b =  as Phaser.Physics.Arcade.Sprite;
        // if (b.getBounds().contains(target.x, target.y)) {
        //   block.destroy();
        // }
  }

  removeElementAt(x: number, y: number) {
    const targetY = y
    const targetX = x - WOOD_SPRITE_SIZE / 2
    // const pointCollide = new Phaser.Physics.Arcade.Factory(this.sceneRef.game.).body(x, y, 1, 1)
    // this.sceneRef.physics.overlap(
    //   pointCollide.gameObject,
    //   this.sceneRef.platformB?.getBlocks(),
    //   async (_, block): Promise<void> => {
    //     const b = block as Phaser.Physics.Arcade.Sprite;
    //     if (b.getBounds().contains(x, y)) {
    //       block.destroy();
    //     }
    //   }
    // );
    // pointCollide.destroy()

    // this.getBlocks()
    //     .getChildren().forEach(tt => console.log(tt.body.position))
    const hello = this.getBlocks()
        .getChildren()
        // .filter(child => child.body.position.x >= x && child.body.position.x <= x + 64 && child.body.position.y >= targetY && child.body.position.y <= targetY + 64)
        .filter(child => child.body.position.x === x - 32 && child.body.position.y === y)
    console.log('this is hello')
    console.log(hello)
    if (hello?.length > 0){
      hello[0].destroy()
    }
    console.log('---this is hello')
    // let block: Phaser.GameObjects.GameObject;
    // this.getBlocks()
    //   .getChildren()
    //   .forEach((b: Phaser.Physics.Arcade.Sprite) => {
    //     if (b.x === targetX && b.y === targetY) {
    //       console.log(b)
    //       block = b as Phaser.GameObjects.GameObject;
    //       console.log(block)
    //     }
    //   });

    console.log(`want to destroy: ${targetX} ${targetY}`)
    // console.log(block)
    // block && block.destroy();
  }
}
