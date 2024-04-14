import * as PIXI from "pixi.js";

import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";
import { Settings } from "@/confourComponents/game/pixi/settings.tsx";
import { ColorScheme } from "@/confourComponents/game/pixi/color-scheme.tsx";
import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";

export class ScoreBoard implements RenderableElement {
  public static readonly CANVAS_MARGIN_TOP =
    PixiBoard.BOARD_MARGIN_TOP + PixiBoard.BOARD_HEIGHT;
  public static readonly HEIGHT = 70;
  public static readonly WIDTH = Settings.CANVAS_WIDTH;

  private scoreGreenText: PIXI.Text;
  private scoreRedText: PIXI.Text;
  private stage: PIXI.Container;

  constructor() {
    this.scoreGreenText = this.buildScoreText(Player_.Green, 0);
    this.scoreRedText = this.buildScoreText(Player_.Red, 0);
    this.stage = this.buildStage(this.scoreGreenText, this.scoreRedText);
  }

  private buildStage(
    scoreGreenText: PIXI.Text,
    scoreRedText: PIXI.Text,
  ): PIXI.Container {
    const stage = new PIXI.Container();

    stage.addChild(this.buildBackground());
    stage.addChild(this.buildScoreCircle(Player_.Green));
    stage.addChild(scoreGreenText);
    stage.addChild(this.buildScoreCircle(Player_.Red));
    stage.addChild(scoreRedText);

    return stage;
  }

  private buildBackground(): PIXI.Graphics {
    const background = new PIXI.Graphics();
    background.beginFill(ColorScheme.LightGray);
    background.drawRect(
      0,
      ScoreBoard.CANVAS_MARGIN_TOP,
      Settings.CANVAS_WIDTH,
      ScoreBoard.HEIGHT,
    );
    background.endFill();
    return background;
  }

  private buildScoreCircle(player: Player_): PIXI.Graphics {
    const scoreCircle = new PIXI.Graphics();

    const circleColor =
      player === Player_.Green ? ColorScheme.DarkGreen : ColorScheme.DarkRed;
    scoreCircle.beginFill(circleColor);

    const xPosition = player === Player_.Green ? 50 : ScoreBoard.WIDTH - 50;
    scoreCircle.drawCircle(
      xPosition,
      ScoreBoard.CANVAS_MARGIN_TOP + ScoreBoard.HEIGHT / 2,
      20,
    );
    return scoreCircle;
  }

  private buildScoreText(player: Player_, score: number): PIXI.Text {
    const xPosition = player === Player_.Green ? 50 : ScoreBoard.WIDTH - 50;

    const scoreText = new PIXI.Text(score.toString(), {
      fontFamily: "Arial",
      fontSize: "20px",
      fill: "#FFFFFF",
    });

    scoreText.x = xPosition - 5;
    scoreText.y = ScoreBoard.CANVAS_MARGIN_TOP + 23;

    return scoreText;
  }

  public playerWon(player: Player_): void {
    if (player === Player_.Green) {
      const currentScoreGreen = Number(this.scoreGreenText.text);
      this.scoreGreenText.text = (currentScoreGreen + 1).toString();
    } else {
      const currentScoreRed = Number(this.scoreRedText.text);
      this.scoreRedText.text = (currentScoreRed + 1).toString();
    }
  }

  public getStage(): PIXI.Container {
    return this.stage;
  }
}
