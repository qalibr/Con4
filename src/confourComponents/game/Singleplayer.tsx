import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { PixiGame } from '@/confourComponents/game/pixi/pixi-game.tsx';
import { Settings } from '@/confourComponents/game/pixi/settings.tsx';

const PixiComponent = () => {
    const pixiContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderer = new PIXI.Renderer({
            width: Settings.CANVAS_WIDTH,
            height: Settings.CANVAS_HEIGHT,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        if (pixiContainer.current) {
            pixiContainer.current.appendChild(renderer.view);
        }

        const game = new PixiGame(renderer);
        const ticker = new PIXI.Ticker();
        ticker.add(() => {
            game.update();
            game.render();
        });
        ticker.start();

        return () => {
            ticker.stop();
            ticker.remove(() => {
                game.update();
                game.render();
            });
            renderer.destroy(true, { children: true });
            if (pixiContainer.current && pixiContainer.current.contains(renderer.view)) {
                pixiContainer.current.removeChild(renderer.view);
            }
        };
    }, []);

    return <div ref={pixiContainer} />;
};

export default PixiComponent;
