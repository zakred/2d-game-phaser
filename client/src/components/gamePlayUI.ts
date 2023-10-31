import UIText from "./uiText";
import UIButton from "./uiButton";
import GamePlayScene from "../scenes/gameplay";

export default class GamePlayUI {
  private sceneRef: GamePlayScene;
  private text: UIText;
  private roomNameText: Phaser.GameObjects.Text;
  private finalText: Phaser.GameObjects.Text;
  private copiedText: Phaser.GameObjects.Text;
  private copiedTimeoutId: any
  private left_bottom_txt: UIText;
  private right_bottom_txt: UIText;
  private count: UIText;
  private starButton: UIButton;

  constructor(scene: GamePlayScene, isHost: boolean, roomId: string) {
    const initalText = isHost ? "Waiting for players" : "Ready to start";
    const roomNameText = this.#getRoomNameText(roomId)
    const moveText = "Left click to move your character";
    const shootText = "Right click to attack the enemy";
    this.sceneRef = scene;
    this.text = new UIText(scene, scene.cameras.main.width / 2, 18, initalText);
    this.finalText = scene.add.text(scene.cameras.main.width/2 - 100,128,roomNameText,{fontSize:40, color: 'black'})
    this.finalText.visible = false
    //this.roomNameText = new UIText(scene, scene.cameras.main.width / 2, 125, roomNameText, 50);
    this.roomNameText = scene.add.text(scene.cameras.main.width/2,128,roomNameText,{fontSize:48, color: 'black'})
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown',()=> this.#copyTextToClipboard(roomId))
    this.copiedText = scene.add.text((scene.cameras.main.width/2) + 80,150, 'Room name copied',{fontSize:20, color: 'gray'})
    this.copiedText.visible = false
    const leftInitialTxt = isHost ? moveText : shootText;
    this.left_bottom_txt = new UIText(
      scene,
      160,
      scene.cameras.main.height - 80,
      leftInitialTxt,
      20
    );
    const rightInitialTxt = isHost ? shootText : moveText;
    this.right_bottom_txt = new UIText(
      scene,
      scene.cameras.main.width - 160,
      scene.cameras.main.height - 80,
      rightInitialTxt,
      20
    );
  }

  #getRoomNameText(roomName: string) {
    return `Room name: ${roomName}`
  }

  #fallbackCopyTextToClipboard(text: string) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }
  #copyTextToClipboard(text: string) {
    this.#showCopied()
    if (!navigator.clipboard) {
      this.#fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }

  #showCopied() {
    clearTimeout(this.copiedTimeoutId)
    this.copiedText.visible = true
    this.copiedTimeoutId = setTimeout(() => {
      this.copiedText.visible = false
    }, 2000)
  }

  updateText(text: string, fontSize?: number) {
    this.text.update(text, fontSize);
  }

  updateFinalText(text: string) {
    this.finalText.text = text
    this.finalText.visible = true
  }

  updateCount(count: string) {
    if (!this.count) {
      this.count = new UIText(
        this.sceneRef,
        this.sceneRef.cameras.main.width / 2,
        125,
        "10"
      );
    }
    this.count.update(count);
  }

  destroyCount() {
    if (this.count){
      this.count.destroy()
    }
  }

  showStartButton(show: boolean) {
    if (show) {
      this.starButton = new UIButton(
        this.sceneRef,
        this.sceneRef.cameras.main.width / 2,
        225,
        "Start",
        () => this.sceneRef.roomService.startGame()
      );
    } else {
      this.starButton && this.starButton.destroy();
    }
  }

  destroyRoomNameText() {
    this.roomNameText.destroy()
  }
}
