import * as PIXI from "pixi.js";

import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { UpdateableElement } from "@/confourComponents/game/pixi/util/updateables.tsx";
import { Player_ } from "@/confourComponents/game/pixi/util/player.tsx";
import { Coin } from "@/confourComponents/game/pixi/components/board/coin.tsx";
import { CoinsTracker } from "@/confourComponents/game/pixi/util/coins-tracker.tsx";
import { SelectionPointer } from "@/confourComponents/game/pixi/components/board/selection-pointer.tsx";
import { SelectionStripe } from "@/confourComponents/game/pixi/components/board/selection-stripe.tsx";

export class PixiBoard implements RenderableElement, UpdateableElement {
  public static readonly BOARD_X_Y: [number, number] = [6, 7];
  public static readonly COIN_MARGIN = 20;
  public static readonly BOARD_PADDING = 20;
  public static readonly BOARD_WIDTH = 580;
  public static readonly BOARD_HEIGHT = 500;
  public static readonly BOARD_MARGIN_TOP = 50;

  private readonly boardSprite: PIXI.Sprite;
  private readonly coinsTracker: CoinsTracker;
  private readonly selectionStripes: SelectionStripe[] = [];
  private readonly selectionPointers: SelectionPointer[] = [];
  private readonly onGameOver: (player?: Player_) => void;
  private readonly onActivePlayerChange: (player: Player_) => void;

  private allCoins: Coin[] = [];
  private activePlayer: Player_;

  constructor(
    activePlayer: Player_,
    onGameOver: (player?: Player_) => void,
    onActivePlayerChange: (player: Player_) => void,
  ) {
    this.activePlayer = activePlayer;
    this.onGameOver = onGameOver;
    this.onActivePlayerChange = onActivePlayerChange;
    this.coinsTracker = new CoinsTracker(PixiBoard.BOARD_X_Y);

    for (
      let columnIndex = 0;
      columnIndex < PixiBoard.BOARD_X_Y[1];
      columnIndex++
    ) {
      const selectionStripe = new SelectionStripe(columnIndex);
      selectionStripe.subscribeToOnMouseOver((stripeIndex: number) =>
        this.onSelectionStripeMouseOver(stripeIndex),
      );
      selectionStripe.subscribeToOnMouseOut((stripeIndex: number) =>
        this.onSelectionStripeMouseOut(stripeIndex),
      );
      selectionStripe.subscribeToOnMouseClick((stripeIndex: number) =>
        this.onSelectionStripeMouseClick(stripeIndex),
      );
      this.selectionStripes.push(selectionStripe);
      const immutableColumnIndex = columnIndex;
      this.selectionPointers.push(
        new SelectionPointer(
          columnIndex,
          () =>
            this.coinsTracker.isEmptySlotAvailable(immutableColumnIndex) &&
            !this.coinsTracker.isGameOver(),
        ),
      );
    }

    this.boardSprite = this.buildBoardSprite();
  }

  private buildBoardSprite(): PIXI.Sprite {
    const texture = PIXI.Texture.from("./img/board.png");
    const sprite = new PIXI.Sprite(texture);
    sprite.width = PixiBoard.BOARD_WIDTH;
    sprite.height = PixiBoard.BOARD_HEIGHT;
    sprite.position.y = PixiBoard.BOARD_MARGIN_TOP;
    return sprite;
  }

  private dropCoin(columnIndex: number): void {
    const rowAndColumnIndex = this.coinsTracker.addCoin(
      this.activePlayer,
      columnIndex,
    );
    const coin = new Coin(
      this.activePlayer,
      rowAndColumnIndex,
      PixiBoard.getCenter(rowAndColumnIndex[0], rowAndColumnIndex[1]),
    );
    this.allCoins.push(coin);
  }

  private onSelectionStripeMouseOver(stripeIndex: number): void {
    this.selectionStripes
      .filter((stripe: SelectionStripe) => stripe.index !== stripeIndex)
      .forEach((stripe: SelectionStripe) => stripe.setFocus(false));
    // @ts-expect-error SelectionPointer could be undefined at this point.
    this.selectionPointers
      .find((pointer: SelectionPointer) => pointer.stripeIndex === stripeIndex)
      .show(this.activePlayer);
  }

  private onSelectionStripeMouseOut(stripeIndex: number): void {
    // @ts-expect-error SelectionPointer could be undefined at this point.
    this.selectionPointers
      .find((pointer: SelectionPointer) => pointer.stripeIndex === stripeIndex)
      .hide();
  }

  private onSelectionStripeMouseClick(stripeIndex: number): void {
    if (
      this.coinsTracker.isEmptySlotAvailable(stripeIndex) &&
      !this.coinsTracker.isGameOver()
    ) {
      this.dropCoin(stripeIndex);

      if (this.coinsTracker.isWin()) {
        this.coinsTracker
          .getWinningCoinPositions()
          .forEach((coinsIndexPosition: [number, number]) =>
            this.allCoins
              .find(
                (coin: Coin) =>
                  coin.rowAndColumnIndex[0] === coinsIndexPosition[0] &&
                  coin.rowAndColumnIndex[1] === coinsIndexPosition[1],
              )
              ?.designatedWinningCoin(),
          );
        this.onGameOver(this.coinsTracker.getWinner());
      } else if (this.coinsTracker.isTie()) {
        this.onGameOver(undefined);
      } else {
        this.switchActivePlayer();
      }
    }
  }

  private switchActivePlayer(): void {
    this.activePlayer =
      this.activePlayer === Player_.Red ? Player_.Green : Player_.Red;
    this.onActivePlayerChange(this.activePlayer);
  }

  public startNewGame(player: Player_): void {
    this.coinsTracker.reset();
    this.allCoins = [];
    this.activePlayer = player;
  }

  public update(): void {
    this.allCoins.forEach((coin) => coin.update());
  }

  public getStage(): PIXI.Container {
    const stage = new PIXI.Container();

    this.allCoins.forEach((coin) => stage.addChild(coin.getStage()));
    stage.addChild(this.boardSprite);
    this.selectionStripes.forEach((stripe) =>
      stage.addChild(stripe.getStage()),
    );
    this.selectionPointers.forEach((stripe) =>
      stage.addChild(stripe.getStage()),
    );

    return stage;
  }

  public static getCenter(column: number, row: number): PIXI.Point {
    const x = this.getColumnCenter(column);
    const y = this.getRowCenter(row);
    return new PIXI.Point(x, y);
  }

  public static getColumnCenter(column: number): number {
    return (
      PixiBoard.BOARD_PADDING +
      Coin.DIAMETER / 2 +
      column * (PixiBoard.COIN_MARGIN + Coin.DIAMETER)
    );
  }

  public static getRowCenter(row: number): number {
    return (
      PixiBoard.BOARD_MARGIN_TOP +
      PixiBoard.BOARD_PADDING +
      Coin.DIAMETER / 2 +
      (PixiBoard.BOARD_X_Y[0] - 1 - row) *
        (Coin.DIAMETER + PixiBoard.COIN_MARGIN)
    );
  }
}
