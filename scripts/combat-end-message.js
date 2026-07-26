/**
 * Combat End Message
 * Posts a GM-only chat message when combat ends, with a button to open the equipment viewer
 */

import { PlayerEquipmentViewer } from "./player-equipment-viewer.js";

const FLAG_KEY = "combatEndPrompt";

/**
 * Post the GM-only prompt when a combat encounter is ended
 */
Hooks.on("deleteCombat", async (combat, options, userId) => {
	// Wait for settings to be registered
	if (!game.settings.settings.has("nyendras-steew-cooker.enableCombatEndMessage")) return;
	if (!game.settings.get("nyendras-steew-cooker", "enableCombatEndMessage")) return;

	// Only one GM should create the message
	if (!game.user.isGM) return;
	if (game.users.activeGM && !game.users.activeGM.isSelf) return;

	const rounds = combat.round ?? 0;

	await ChatMessage.create({
		whisper: ChatMessage.getWhisperRecipients("GM"),
		flags: {
			"nyendras-steew-cooker": { [FLAG_KEY]: true }
		},
		content: `
			<div class="nsc-combat-end">
				<p class="nsc-combat-end-title">
					<i class="fas fa-flag-checkered"></i> Combat ended after ${rounds} round(s).
				</p>
				<button type="button" class="nsc-open-equipment-viewer">
					<i class="fas fa-shield-alt"></i> Open Equipment Viewer
				</button>
			</div>
		`
	});
});

/**
 * Wire up the button on render
 */
Hooks.on("renderChatMessage", (message, html) => {
	if (!message.getFlag("nyendras-steew-cooker", FLAG_KEY)) return;
	if (!game.user.isGM) return;

	html.find(".nsc-open-equipment-viewer").on("click", (event) => {
		event.preventDefault();
		new PlayerEquipmentViewer().render(true);
	});
});
