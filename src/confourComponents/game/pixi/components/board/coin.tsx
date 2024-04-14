import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { UpdateableElement } from "@/confourComponents/game/pixi/util/updateables.tsx";
import * as PIXI from "pixi.js";

export class Coin implements RenderableElement, UpdateableElement {
  // Defining constants, coin size, physics.
  public static readonly DIAMETER = 60;
  public static readonly DROP_VELOCITY = 6;
  public static readonly DROP_START_Y = 20;
  public static readonly WINNING_COIN_ROTATION_ACCELERATION = 0.001;
  public static readonly WINNING_COIN_MAX_ROTATION_SPEED = 0.1;

  // x-y coordinates the coin can be placed in.
  public rowAndColumnIndex: [number, number] | undefined;

  private readonly player: Player_ | undefined;
  private readonly finalPosition: PIXI.Point | undefined;
  private readonly sprite: PIXI.Sprite | undefined;
  private readonly stage: PIXI.Container | undefined; // Containers are necessary to manage assets

  private isAtFinalPosition: boolean = false;
  private isWinningCoin: boolean = false;
  private rotationSpeed: number = 0;

  constructor(
    player: Player_,
    rowAndColumnIndex: [number, number],
    finalPosition: PIXI.Point,
  ) {
    // Save variables to class instance.
    this.player = player;
    this.rowAndColumnIndex = rowAndColumnIndex;
    this.finalPosition = finalPosition;

    // Loading textures from source.
    const greenTexture = PIXI.Texture.from("./img/4-count-green.png");
    const redTexture = PIXI.Texture.from("./img/4-count-red.png");
    const texture = player === Player_.Green ? greenTexture : redTexture;

    // Set the texture into the sprite of the coin.
    const sprite = new PIXI.Sprite(texture);

    // Filling space between board and coin.
    sprite.width = Coin.DIAMETER + 2;
    sprite.height = Coin.DIAMETER + 2;

    sprite.anchor.set(0.5, 0.5); // Centering the sprite
    sprite.position.x = finalPosition.x;
    sprite.position.y = Coin.DROP_START_Y;
    this.sprite = sprite; // Saving the sprite to the class instance.

    // Create stage container and add the coin's sprite to it.
    const stage = new PIXI.Container();
    stage.addChild(sprite);
    this.stage = stage; // Save to class instance.
  }

  public designatedWinningCoin(): void {
    this.isWinningCoin = true;
  }

  private updateRotationOfWinningCoin() {
    if (this.sprite === undefined) return;

    // Increase rotation speed until it reaches maximum speed.
    if (this.rotationSpeed < Coin.WINNING_COIN_MAX_ROTATION_SPEED) {
      this.rotationSpeed += Coin.WINNING_COIN_ROTATION_ACCELERATION;
    }

    // Add rotation to the sprite.
    this.sprite.rotation += this.rotationSpeed;
  }

  // Update method that can be called to update the state and position of the coin.
  public update(): void {
    if (this.sprite === undefined || this.finalPosition === undefined) return;

    // Handling rotation depending on if it is a winning coin and if it is in final position.
    if (this.isAtFinalPosition && this.isWinningCoin) {
      this.updateRotationOfWinningCoin();
    }

    // Stop updating if it is the final position.
    if (this.isAtFinalPosition) return;

    // This will continue to drop the coin downwards until it reaches the final position.
    this.sprite.position.y += Coin.DROP_VELOCITY;
    if (this.sprite.position.y >= this.finalPosition?.y) {
      this.sprite.position.y = this.finalPosition.y;
      this.isAtFinalPosition = true; // Updating the class instance 'final position'.
    }
  }

  // Exposing a getter of the stage container.
  public getStage(): PIXI.Container | undefined {
    return this.stage;
  }
}
