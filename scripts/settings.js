/**
 * Settings Registration
 * Registers all module settings
 */

Hooks.once("init", () => {
	// Chat Trash Icon setting
	game.settings.register("nyendras-steew-cooker", "enableChatTrashIcon", {
		name: "Enable Chat Trash Icon",
		hint: "Show a quick delete button on chat messages for GMs.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});

	// Defender Wins on Tie setting
	game.settings.register("nyendras-steew-cooker", "defenderWinsOnTie", {
		name: "Defender Wins on Tie",
		hint: "If enabled, attack rolls that match AC will count as a miss.",
		scope: "world",
		config: true,
		type: Boolean,
		default: true
	});
});
