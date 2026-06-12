/**
 * DialogueBox — typewriter dialogue panel rendered in UIScene
 *
 * Builds the bottom dialogue panel per UI-SPEC Component 2:
 *   - x=0, y=694, 480×160, fill #1a1a2e a0.95, top border #16213e
 *   - 48×48 portrait slot (placeholder #16213e square if portrait key missing)
 *   - NPC name via t('npc.{id}.name') at Heading 16px
 *   - Dialogue text with wordWrap {width:388, useAdvancedWrap:true}
 *   - 30ms-per-char typewriter via scene.time.addEvent
 *   - Advance ▼ blink; pointerdown skip/advance/close
 *   - On close emits GameEvents.DIALOGUE_COMPLETE
 *
 * Pattern: PATTERNS.md DialogueBox.ts + UI-SPEC Component 2
 */
import { Scene } from 'phaser';
import { t } from '../services/i18n';
import { GameEvents, Events } from '../events/GameEvents';

/** Single line of dialogue from the JSON file. */
export interface DialogueLine {
    portrait: string;
    text: string;
}

const PANEL_X      = 0;
const PANEL_Y      = 694;
const PANEL_W      = 480;
const PANEL_H      = 160;
const PORTRAIT_X   = 16 + 24;  // center of 48px slot
const PORTRAIT_Y   = 710 + 24;
const NAME_X       = 76;
const NAME_Y       = 710;
const TEXT_X       = 76;
const TEXT_Y       = 734;
const ADVANCE_X    = 456;
const ADVANCE_Y    = 830;

export class DialogueBox {
    private readonly scene: Scene;
    private readonly panel: Phaser.GameObjects.Container;
    private readonly portraitImg: Phaser.GameObjects.Image;
    private readonly portraitPlaceholder: Phaser.GameObjects.Rectangle;
    private readonly nameText: Phaser.GameObjects.Text;
    private readonly bodyText: Phaser.GameObjects.Text;
    private readonly advanceText: Phaser.GameObjects.Text;
    private readonly backdrop: Phaser.GameObjects.Rectangle;

    private lines: DialogueLine[] = [];
    private lineIndex = 0;
    private npcId = '';
    private typewriterTimer: Phaser.Time.TimerEvent | null = null;
    private blinkTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene) {
        this.scene = scene;

        // Full-canvas backdrop at alpha 0.3
        this.backdrop = scene.add.rectangle(0, 0, 480, 854, 0x000000, 0.3)
            .setOrigin(0, 0)
            .setDepth(10)
            .setVisible(false);

        // Panel background
        const panelBg = scene.add.rectangle(PANEL_X + PANEL_W / 2, PANEL_Y + PANEL_H / 2, PANEL_W, PANEL_H, 0x1a1a2e)
            .setAlpha(0.95);

        // Top border
        const topBorder = scene.add.rectangle(PANEL_X + PANEL_W / 2, PANEL_Y, PANEL_W, 2, 0x16213e)
            .setOrigin(0.5, 0);

        // Portrait placeholder (shown when portrait texture missing)
        this.portraitPlaceholder = scene.add.rectangle(PORTRAIT_X, PORTRAIT_Y, 48, 48, 0x16213e)
            .setStrokeStyle(2, 0xe8e8e8);

        // Portrait image (hidden until we know the texture key exists)
        this.portraitImg = scene.add.image(PORTRAIT_X, PORTRAIT_Y, '__DEFAULT')
            .setDisplaySize(48, 48)
            .setVisible(false);

        // NPC name
        this.nameText = scene.add.text(NAME_X, NAME_Y, '', {
            fontSize: '16px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        });

        // Dialogue body
        this.bodyText = scene.add.text(TEXT_X, TEXT_Y, '', {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
            wordWrap: { width: 388, useAdvancedWrap: true },
        });

        // Advance indicator
        this.advanceText = scene.add.text(ADVANCE_X, ADVANCE_Y, t('dialogue.advance'), {
            fontSize: '8px',
            color: '#e8e8e8',
            fontFamily: '"Press Start 2P", monospace',
        }).setOrigin(0.5).setVisible(false);

        // Container groups all elements for show/hide
        this.panel = scene.add.container(0, 0, [
            panelBg, topBorder,
            this.portraitPlaceholder, this.portraitImg,
            this.nameText, this.bodyText, this.advanceText,
        ]).setDepth(11).setVisible(false);
    }

    /** Show the dialogue box with a list of lines for a given NPC. */
    show(npcId: string, lines: DialogueLine[]): void {
        this.npcId      = npcId;
        this.lines      = lines;
        this.lineIndex  = 0;
        this.backdrop.setVisible(true);
        this.panel.setVisible(true);
        this.renderLine(this.lineIndex);

        // Pointer to advance
        this.scene.input.on('pointerdown', this.handlePointerDown, this);
    }

    private renderLine(index: number): void {
        const line = this.lines[index];
        if (!line) return;

        // NPC name via i18n
        this.nameText.setText(t(`npc.${this.npcId}.name`));

        // Portrait — use texture if available, placeholder otherwise
        if (this.scene.textures.exists(line.portrait)) {
            this.portraitImg.setTexture(line.portrait).setVisible(true);
            this.portraitPlaceholder.setVisible(false);
        } else {
            this.portraitImg.setVisible(false);
            this.portraitPlaceholder.setVisible(true);
        }

        // Typewriter effect
        this.bodyText.setText('');
        this.advanceText.setVisible(false);
        this.stopTimers();

        const fullText = line.text;
        let i = 0;
        this.typewriterTimer = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                this.bodyText.setText(this.bodyText.text + fullText[i++]);
                if (i >= fullText.length) {
                    this.typewriterTimer = null;
                    this.showAdvanceIndicator();
                }
            },
            repeat: fullText.length - 1,
        });
    }

    private showAdvanceIndicator(): void {
        this.advanceText.setVisible(true);
        this.blinkTimer = this.scene.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                this.advanceText.setVisible(!this.advanceText.visible);
            },
        });
    }

    private handlePointerDown = (): void => {
        if (this.typewriterTimer) {
            // Skip typewriter — show full text immediately
            this.stopTimers();
            const line = this.lines[this.lineIndex];
            if (line) {
                this.bodyText.setText(line.text);
                this.showAdvanceIndicator();
            }
        } else {
            // Advance to next line or close
            this.lineIndex++;
            if (this.lineIndex < this.lines.length) {
                this.renderLine(this.lineIndex);
            } else {
                this.close();
            }
        }
    };

    private close(): void {
        this.stopTimers();
        this.scene.input.off('pointerdown', this.handlePointerDown, this);
        this.backdrop.setVisible(false);
        this.panel.setVisible(false);
        GameEvents.emit(Events.DIALOGUE_COMPLETE, { npcId: this.npcId });
    }

    private stopTimers(): void {
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }
        if (this.blinkTimer) {
            this.blinkTimer.remove();
            this.blinkTimer = null;
        }
    }

    destroy(): void {
        this.stopTimers();
        // WR-07 fix: guard against calling input.off() after the InputPlugin has
        // been torn down (e.g. if UIScene.shutdown() order changes). Phaser
        // destroys scene systems after shutdown() returns, so calling destroy()
        // from within UIScene.shutdown() is normally safe — but the null check
        // makes the ordering robust against future refactors.
        if (this.scene.input) {
            this.scene.input.off('pointerdown', this.handlePointerDown, this);
        }
    }
}
