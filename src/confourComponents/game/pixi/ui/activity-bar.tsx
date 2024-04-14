import * as PIXI from "pixi.js";

import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";
import { ScoreBoard } from "@/confourComponents/game/pixi/ui/score-board.tsx";

export class ActivityBar implements RenderableElement {
  public static readonly CANVAS_MARGIN_TOP =
    PixiBoard.BOARD_MARGIN_TOP + PixiBoard.BOARD_HEIGHT + ScoreBoard.HEIGHT;
  private readonly onNewGameRequest: () => void;

  private readonly greenPlayerTurnStatus: PIXI.Container;
  private readonly redPlayerTurnStatus: PIXI.Container;
  private readonly newGameButton: PIXI.Container;

  private activeStage: PIXI.Container = new PIXI.Container();

  constructor(initialTurn: Player_, onNewGameRequest: () => void) {
    this.onNewGameRequest = onNewGameRequest;

    this.greenPlayerTurnStatus = new PIXI.Container();
    const greenPlayerTurnSprite = new PIXI.Sprite(
      PIXI.Texture.from("./board/img/turn-blue.png"),
    );
    greenPlayerTurnSprite.position.y = ActivityBar.CANVAS_MARGIN_TOP;
    this.greenPlayerTurnStatus.addChild(greenPlayerTurnSprite);

    this.redPlayerTurnStatus = new PIXI.Container();
    const redPlayerTurnSprite = new PIXI.Sprite(
      PIXI.Texture.from("./board/img/turn-red.png"),
    );
    redPlayerTurnSprite.position.y = ActivityBar.CANVAS_MARGIN_TOP;
    this.redPlayerTurnStatus.addChild(redPlayerTurnSprite);

    this.newGameButton = new PIXI.Container();
    const newGameButtonSprite = new PIXI.Sprite(
      PIXI.Texture.from("./board/img/new-game.png"),
    );
    newGameButtonSprite.position.y = ActivityBar.CANVAS_MARGIN_TOP;
    newGameButtonSprite.interactive = true;
    newGameButtonSprite.on("click", () => this.onNewGameRequest());
    this.newGameButton.addChild(newGameButtonSprite);

    this.onActivePlayerChange(initialTurn);
  }

  public onActivePlayerChange(player: Player_): void {
    if (player === Player_.Green) {
      this.activeStage = this.greenPlayerTurnStatus;
    } else {
      this.activeStage = this.redPlayerTurnStatus;
    }
  }

  public onGameOver(): void {
    this.activeStage = this.newGameButton;
  }

  public getStage(): PIXI.Container {
    return this.activeStage;
  }
}
