/**
 * Settings Registration
 * Registers all module settings
 */

import { PlayerEquipmentViewer } from "./player-equipment-viewer.js";
import { DurabilityNamingConfig } from "./durability-naming-config.js";

Hooks.once("init", () => {
	// Player Equipment Viewer menu button
	game.settings.registerMenu("nyendras-steew-cooker", "playerEquipmentViewer", {
		name: "View Player Equipment",
		label: "Open Equipment Viewer",
		hint: "View all equipped weapons and equipment for each player.",
		icon: "fas fa-shield-alt",
		type: PlayerEquipmentViewer,
		restricted: true
	});

	// Durability Naming Configuration menu button
	game.settings.registerMenu("nyendras-steew-cooker", "durabilityNamingConfig", {
		name: "Durability Naming",
		label: "Configure Durability",
		hint: "Customize durability tier names and colors.",
		icon: "fas fa-wrench",
		type: DurabilityNamingConfig,
		restricted: true
	});

	// Durability tiers setting (hidden from config UI)
	game.settings.register("nyendras-steew-cooker", "durabilityTiers", {
		scope: "world",
		config: false,
		type: Array,
		default: DurabilityNamingConfig.getDefaultTiers()
	});

	// Show durability names instead of percentage
	game.settings.register("nyendras-steew-cooker", "showDurabilityNames", {
		scope: "world",
		config: false,
		type: Boolean,
		default: false
	});

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
