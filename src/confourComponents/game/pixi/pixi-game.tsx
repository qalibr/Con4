import * as PIXI from "pixi.js";

import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";
import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";

export class PixiGame {
  private readonly renderer: PIXI.Renderer;

  private readonly pixiBoard: PixiBoard;

  private playerWhoIsActiveFirst: Player_ = Player_.Red;
  private activePlayer: Player_ = this.playerWhoIsActiveFirst;

  constructor(rendered: PIXI.Renderer) {
    this.renderer = rendered;
    this.pixiBoard = new PixiBoard(
      this.activePlayer,
      (player) => this.onGameOver(player),
      (player) => this.onActivePlayerChange(player),
    );
  }

  public update(): void {
    this.pixiBoard.update();
  }

  public render(): void {
    const rootStage = new PIXI.Container();
    ([this.pixiBoard] as Array<RenderableElement>)
      .map((element) => element.getStage())
      .forEach((stage) => rootStage.addChild(stage));
    this.renderer.render(rootStage);
  }

  private onGameOver(playerThatWon?: Player_): void {
    if (playerThatWon) {
      this.scoreBoard.playerWon(playerThatWon);
    }
    this.activityBar.onGameOver();
  }
}
