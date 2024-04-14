import * as PIXI from "pixi.js";

export interface RenderableElement {
    getStage(): PIXI.Container | undefined;
}