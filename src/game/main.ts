import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Settings } from './scenes/Settings';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 480,
    height: 854,
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    antialias: false,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        min: { width: 320, height: 568 },
        max: { width: 480, height: 1024 },
    },
    audio: {
        disableWebAudio: false,
    },
    scene: [Boot, Preloader, MainMenu, Settings],
};

export const StartGame = (parent: string) => new Game({ ...config, parent });
