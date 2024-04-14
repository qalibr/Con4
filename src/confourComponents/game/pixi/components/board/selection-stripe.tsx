import * as PIXI from "pixi.js";

import { PixiBoard } from "@/confourComponents/game/pixi/components/board/pixi-board.tsx";
import { RenderableElement } from "@/confourComponents/game/pixi/util/renderables.tsx";
import { Coin } from "@/confourComponents/game/pixi/components/board/coin.tsx";

enum VisbilityLevel {
  Low = 0.01,
  High = 0.15,
}

export class SelectionStripe implements RenderableElement {
  public readonly index: number;

  private stripeGraphics: PIXI.Graphics = new PIXI.Graphics();
  private readonly stripeRectangleParameters: [number, number, number, number];

  private readonly mouseOverEventListeners: Array<
    (stripeIndex: number) => void
  > = [];

  private readonly mouseOutEventListeners: Array<
    (stripeIndex: number) => void
  > = [];

  private readonly mouseClickEventListeners: Array<
    (stripeIndex: number) => void
  > = [];

  constructor(columnIndex: number) {
    this.index = columnIndex;
    this.stripeRectangleParameters =
      SelectionStripe.getStripeRectangleParameters(columnIndex);
    this.setStripe(VisbilityLevel.Low);
  }

  private setStripe(visibilityLevel: VisbilityLevel): void {
    const stripe = new PIXI.Graphics();
    stripe.beginFill(0x000000);
    stripe.alpha = visibilityLevel;
    // eslint-disable-next-line prefer-spread
    stripe.drawRect.apply(stripe, this.stripeRectangleParameters);
    stripe.endFill();
    stripe.interactive = true;

    stripe.on("mouseover", () => this.onMouseOver());
    stripe.on("mouseout", () => this.onMouseOut());
    stripe.on("click", () => this.onMouseClick());

    this.stripeGraphics = stripe;
  }

  public setFocus(isInFocus: boolean): void {
    if (isInFocus) {
      this.setStripe(VisbilityLevel.High);
      this.mouseOverEventListeners.forEach((listener) => listener(this.index));
    } else {
      this.setStripe(VisbilityLevel.Low);
      this.mouseOutEventListeners.forEach((listener) => listener(this.index));
    }
  }

  public subscribeToOnMouseOver(eventListener: (stripeIndex: number) => void) {
    this.mouseOverEventListeners.push(eventListener);
  }

  private onMouseOver(): void {
    if (this.stripeGraphics.alpha != VisbilityLevel.High) {
      this.setFocus(true);
    }
  }

  public subscribeToOnMouseOut(eventListener: (stripeIndex: number) => void) {
    this.mouseOutEventListeners.push(eventListener);
  }

  private onMouseOut(): void {
    if (this.stripeGraphics.alpha != VisbilityLevel.Low) {
      this.setFocus(false);
    }
  }

  public subscribeToOnMouseClick(eventListener: (stripeIndex: number) => void) {
    this.mouseClickEventListeners.push(eventListener);
  }

  private onMouseClick(): void {
    this.mouseClickEventListeners.forEach((listener) => listener(this.index));
    this.mouseOverEventListeners.forEach((listener) => listener(this.index)); // Force refresh if cursor stays on same stripe.
  }

  public getStage(): PIXI.Container {
    const stage = new PIXI.Container();
    stage.addChild(this.stripeGraphics);
    return stage;
  }

  private static get width(): number {
    return Coin.DIAMETER + PixiBoard.COIN_MARGIN;
  }

  public static getStripeRectangleParameters(
    columnIndex: number,
  ): [number, number, number, number] {
    const boardPadding =
      columnIndex == 0
        ? 0
        : PixiBoard.BOARD_PADDING - PixiBoard.COIN_MARGIN / 2;

    const isFirstOrLast =
      columnIndex == 0 || columnIndex == PixiBoard.BOARD_X_Y[1] - 1;

    return [
      boardPadding + columnIndex * SelectionStripe.width,
      PixiBoard.BOARD_MARGIN_TOP,
      SelectionStripe.width + (isFirstOrLast ? PixiBoard.COIN_MARGIN / 2 : 0),
      PixiBoard.BOARD_HEIGHT,
    ];
  }
}
