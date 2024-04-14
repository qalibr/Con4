import * as PIXI from "pixi.js";

import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";
import { ActivityBar } from "@/confourComponents/game/pixi/ui/activity-bar.tsx";
import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { ScoreBoard } from "@/confourComponents/game/pixi/ui/score-board.tsx";

export class PixiGame {
  private readonly renderer: PIXI.Renderer;

  private readonly pixiBoard: PixiBoard;
  private readonly scoreBoard: ScoreBoard;
  private readonly activityBar: ActivityBar;

  private playerWhoIsActiveFirst: Player_ = Player_.Red;
  private activePlayer: Player_ = this.playerWhoIsActiveFirst;

  constructor(rendered: PIXI.Renderer) {
    this.renderer = rendered;
    this.scoreBoard = new ScoreBoard();
    this.pixiBoard = new PixiBoard(
      this.activePlayer,
      (player) => this.onGameOver(player),
      (player) => this.onActivePlayerChange(player),
    );

    this.activityBar = new ActivityBar(this.activePlayer, () =>
      this.onNewGameRequest(),
    );
  }

  public update(): void {
    this.pixiBoard.update();
  }

  public render(): void {
    const rootStage = new PIXI.Container();
    ([this.pixiBoard] as Array<RenderableElement>)
      .map((element) => element.getStage())
      // @ts-expect-error fine
      .forEach((stage) => rootStage.addChild(stage));
    this.renderer.render(rootStage);
  }

  private onGameOver(playerThatWon?: Player_): void {
    if (playerThatWon) {
      this.scoreBoard.playerWon(playerThatWon);
    }
    this.activityBar.onGameOver();
  }

  private onActivePlayerChange(player: Player_): void {
    this.activePlayer = player;
    this.activityBar.onActivePlayerChange(player);
  }

  private onNewGameRequest(): void {
    const playerThatWonLastGame = this.activePlayer;
    if (playerThatWonLastGame === Player_.Green) {
      this.activePlayer = Player_.Red;
    } else {
      this.activePlayer = Player_.Green;
    }

    this.activityBar.onActivePlayerChange(this.activePlayer);
    this.pixiBoard.startNewGame(this.activePlayer);
  }
}
