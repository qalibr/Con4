import * as PIXI from "pixi.js";

import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";

export class SelectionPointer implements RenderableElement {
  public static readonly POINTER_MARGIN_TOP = 20;
  public static readonly WIDTH = 25;
  public static readonly HEIGHT = 20;

  public readonly stripeIndex: number;

  private readonly sprite_red: PIXI.Sprite;
  private readonly sprite_green: PIXI.Sprite;
  private readonly stage: PIXI.Container;
  private readonly isAvailableForDrop: () => boolean;

  constructor(stripeIndex: number, isAvailableForDrop: () => boolean) {
    this.stripeIndex = stripeIndex;
    this.isAvailableForDrop = isAvailableForDrop;
    this.sprite_red = this.buildSprite(stripeIndex, Player_.Red);
    this.sprite_green = this.buildSprite(stripeIndex, Player_.Green);

    const stage = new PIXI.Container();
    stage.addChild(this.sprite_red);
    stage.addChild(this.sprite_green);
    this.stage = stage;
  }

  private buildSprite(stripeIndex: number, pointerType: Player_): PIXI.Sprite {
    // Load textures from source.
    const redTexture = PIXI.Texture.from("./img/pointer-red.png");
    const greenTexture = PIXI.Texture.from("./img/c4-pointer-green.png");
    const texture = pointerType === Player_.Red ? redTexture : greenTexture;

    // Building sprite with dimensions, position and visibility and hand it the texture from source.
    const sprite = new PIXI.Sprite(texture);
    sprite.width = SelectionPointer.WIDTH;
    sprite.height = SelectionPointer.HEIGHT;
    sprite.anchor.set(0.5, 0.5); // Centering pointer
    sprite.position.x = PixiBoard.getColumnCenter(stripeIndex);
    sprite.position.y = SelectionPointer.POINTER_MARGIN_TOP;
    sprite.visible = false;

    return sprite;
  }

  public show(player: Player_): void {
    this.hide();
    if (!this.isAvailableForDrop()) return;

    if (player === Player_.Red) {
      this.sprite_red.visible = true;
    } else {
      this.sprite_green.visible = true;
    }
  }

  public hide(): void {
    this.sprite_red.visible = false;
    this.sprite_green.visible = false;
  }

  public getStage(): PIXI.Container {
    return this.stage;
  }
}
