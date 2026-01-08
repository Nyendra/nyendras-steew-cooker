/**
 * Item Durability System
 * Tracks durability percentage for weapons and equipment
 * 0% = broken, 100% = good condition
 */

export class ItemDurability {

	/**
	 * Get the durability value for an item
	 * @param {Item} item - The item to check
	 * @returns {number} Durability percentage (0-100)
	 */
	static getDurability(item) {
		return item.getFlag("nyendras-steew-cooker", "durability") ?? 100;
	}

	/**
	 * Set the durability value for an item
	 * @param {Item} item - The item to update
	 * @param {number} value - Durability percentage (0-100)
	 */
	static async setDurability(item, value) {
		const clamped = Math.max(0, Math.min(100, Number(value)));
		await item.setFlag("nyendras-steew-cooker", "durability", clamped);
	}

	/**
	 * Get the attack rolls count for a weapon
	 * @param {Item} item - The item to check
	 * @returns {number} Number of attack rolls
	 */
	static getAttackRolls(item) {
		return item.getFlag("nyendras-steew-cooker", "attackRolls") ?? 0;
	}

	/**
	 * Set the attack rolls count for a weapon
	 * @param {Item} item - The item to update
	 * @param {number} value - Number of attack rolls
	 */
	static async setAttackRolls(item, value) {
		await item.setFlag("nyendras-steew-cooker", "attackRolls", Number(value));
	}

	/**
	 * Increment the attack rolls count for a weapon
	 * @param {Item} item - The item to update
	 */
	static async incrementAttackRolls(item) {
		const current = this.getAttackRolls(item);
		await this.setAttackRolls(item, current + 1);
	}

	/**
	 * Get the damage rolls count for a weapon
	 * @param {Item} item - The item to check
	 * @returns {number} Number of damage rolls
	 */
	static getDamageRolls(item) {
		return item.getFlag("nyendras-steew-cooker", "damageRolls") ?? 0;
	}

	/**
	 * Set the damage rolls count for a weapon
	 * @param {Item} item - The item to update
	 * @param {number} value - Number of damage rolls
	 */
	static async setDamageRolls(item, value) {
		await item.setFlag("nyendras-steew-cooker", "damageRolls", Number(value));
	}

	/**
	 * Increment the damage rolls count for a weapon
	 * @param {Item} item - The item to update
	 */
	static async incrementDamageRolls(item) {
		const current = this.getDamageRolls(item);
		await this.setDamageRolls(item, current + 1);
	}

	/**
	 * Get the damage taken for equipment
	 * @param {Item} item - The item to check
	 * @returns {number} Total damage taken
	 */
	static getDamageTaken(item) {
		return item.getFlag("nyendras-steew-cooker", "damageTaken") ?? 0;
	}

	/**
	 * Set the damage taken for equipment
	 * @param {Item} item - The item to update
	 * @param {number} value - Total damage taken
	 */
	static async setDamageTaken(item, value) {
		await item.setFlag("nyendras-steew-cooker", "damageTaken", Number(value));
	}

	/**
	 * Add damage taken to equipment
	 * @param {Item} item - The item to update
	 * @param {number} amount - Damage amount to add
	 */
	static async addDamageTaken(item, amount) {
		const current = this.getDamageTaken(item);
		await this.setDamageTaken(item, current + amount);
	}

	/**
	 * Get the tier for a given durability value
	 * @param {number} durability - Durability percentage
	 * @returns {Object} Tier object with threshold, name, and color
	 */
	static getDurabilityTier(durability) {
		const tiers = game.settings.get("nyendras-steew-cooker", "durabilityTiers") || [];

		// Sort tiers ascending by threshold
		const sortedTiers = tiers.sort((a, b) => a.threshold - b.threshold);

		// Find the first tier where threshold >= durability
		// This means the tier represents the upper bound of the range
		const tier = sortedTiers.find(t => t.threshold >= durability);

		// Return the tier or use the highest tier as fallback
		return tier || sortedTiers[sortedTiers.length - 1] || { threshold: 0, name: "Unknown", color: "#808080" };
	}

	/**
	 * Get a color class based on durability level
	 * @param {number} durability - Durability percentage
	 * @returns {string} CSS class name (kept for backward compatibility, but now generates inline styles)
	 */
	static getDurabilityColorClass(durability) {
		const tier = this.getDurabilityTier(durability);
		return `durability-tier-${tier.threshold}`;
	}

	/**
	 * Get the color for a durability level
	 * @param {number} durability - Durability percentage
	 * @returns {string} Hex color code
	 */
	static getDurabilityColor(durability) {
		const tier = this.getDurabilityTier(durability);
		return tier.color;
	}

	/**
	 * Get a text label for durability level
	 * @param {number} durability - Durability percentage
	 * @returns {string} Status text
	 */
	static getDurabilityLabel(durability) {
		const tier = this.getDurabilityTier(durability);
		return tier.name;
	}
}

/**
 * Hook into character sheet rendering to add durability column
 * Works with dnd5e v3+ character sheets
 */

// Register hook for dnd5e v3+ character sheets
Hooks.on("renderActorSheetV2", (sheet, html) => {
	if (sheet.actor.type !== "character") return;
	addDurabilityToSheet(sheet, html);
});

/**
 * Add "Repair" option to item context menus for weapons and equipment
 */
Hooks.on("dnd5e.getItemContextOptions", (item, menuItems) => {
	// Only add repair option for weapons and equipment
	if (item.type !== "weapon" && item.type !== "equipment") return;

	// Add the repair option
	menuItems.push({
		name: "Repair",
		icon: '<i class="fas fa-wrench"></i>',
		condition: () => {
			// Only show if durability is less than 100%
			const durability = ItemDurability.getDurability(item);
			return durability < 100;
		},
		callback: async () => {
			await ItemDurability.setDurability(item, 100);
			ui.notifications.info(`${item.name} repaired to 100% durability.`);

			// Re-render the sheet to show updated durability
			if (item.actor?.sheet?.rendered) {
				item.actor.sheet.render();
			}
		}
	});
});

/**
 * Add durability column to character sheet
 * @param {ActorSheet} sheet - The character sheet
 * @param {jQuery} html - The sheet HTML
 */
function addDurabilityToSheet(sheet, html) {
	const actor = sheet.actor;

	// Convert to jQuery if needed
	const $html = html instanceof jQuery ? html : $(html);


	// For dnd5e v3+, find the .items-header elements and add durability column
	// Only add to weapons and equipment sections
	const itemsHeaders = $html.find(".items-header");

	itemsHeaders.each((index, headerElement) => {
		const $header = $(headerElement);

		// Check if this is a weapons or equipment section by looking at the h3 text
		const sectionTitle = $header.find("h3.item-name").text().trim().toLowerCase();

		// Only add durability to weapon and equipment sections
		if (sectionTitle !== "weapons" && sectionTitle !== "equipment") {
			return;
		}

		// Check if durability header already exists
		if ($header.find(".item-header.item-durability").length > 0) {
			return;
		}

		// Find the quantity header column to insert after
		const quantityHeader = $header.find(".item-header.item-quantity");

		if (quantityHeader.length) {
			const durabilityHeader = `<div class="item-header item-durability" data-column-id="durability" data-column-width="60" data-column-priority="350" style="flex: 0 0 60px; min-width: 60px; max-width: 60px;">Durability</div>`;
			quantityHeader.after(durabilityHeader);
		}
	});

	// Add durability value to each weapon and equipment item
	const items = $html.find(".item-list .item");

	items.each((index, itemElement) => {
		const $item = $(itemElement);
		const itemId = $item.attr("data-item-id");
		if (!itemId) return;

		const item = actor.items.get(itemId);
		if (!item) return;

		// Only add durability to weapons and equipment
		if (item.type !== "weapon" && item.type !== "equipment") return;

		// Check if durability already added
		if ($item.find(".item-durability").length > 0) return;

		const durability = ItemDurability.getDurability(item);
		const colorClass = ItemDurability.getDurabilityColorClass(durability);
		const color = ItemDurability.getDurabilityColor(durability);
		const showNames = game.settings.get("nyendras-steew-cooker", "showDurabilityNames") || false;

		// Determine display text
		const displayText = showNames ? ItemDurability.getDurabilityLabel(durability) : `${durability}%`;

		// Find the quantity element in the item row (dnd5e v3+ structure)
		const itemRow = $item.find(".item-row").first();
		const quantityElement = itemRow.find(".item-detail.item-quantity");

		if (quantityElement.length) {
			const durabilityHtml = `
				<div class="item-detail item-durability ${colorClass}"
					 data-column-id="durability"
					 data-item-id="${itemId}"
					 data-durability="${durability}"
					 style="flex: 0 0 60px; min-width: 60px; max-width: 60px; color: ${color};">
					<span class="durability-value">${displayText}</span>
				</div>
			`;
			quantityElement.after(durabilityHtml);
		}
	});
}

/**
 * Track which messages we've already processed to avoid double-counting
 * Format: "messageId:attack" or "messageId:damage"
 */
const processedRolls = new Set();

/**
 * Track attack and damage rolls for weapons
 * Compatible with standard dnd5e and Ready Set Roll
 *
 * Using renderChatMessage instead of createChatMessage because Ready Set Roll
 * injects content and sets flags AFTER the message is created
 */
Hooks.on("renderChatMessage", async (message, html, data) => {
	// Check if this is a roll message
	if (!message.rolls || message.rolls.length === 0) return;

	// Get the actor from the message
	const actor = message.speaker?.actor ? game.actors.get(message.speaker.actor) : null;
	if (!actor) return;

	// Get the item ID from the message flags (dnd5e v3+ structure)
	const itemId = message.flags?.dnd5e?.item?.id;
	if (!itemId) return;

	const item = actor.items.get(itemId);
	if (!item || item.type !== "weapon") return;

	// Check if item is equipped
	if (!item.system.equipped) return;

	// Determine if this has an attack roll
	const hasAttack = message.flags?.rsr5e?.renderAttack === true ||
	                  message.flags?.dnd5e?.roll?.type === "attack";

	// Determine if this has a damage roll
	const hasDamage = message.flags?.rsr5e?.renderDamage === true ||
	                  message.flags?.dnd5e?.roll?.type === "damage";

	// Track attack rolls (only if we haven't already processed this message's attack)
	const attackKey = `${message.id}:attack`;
	if (hasAttack && !processedRolls.has(attackKey)) {
		await ItemDurability.incrementAttackRolls(item);
		processedRolls.add(attackKey);
	}

	// Track damage rolls (only if we haven't already processed this message's damage)
	const damageKey = `${message.id}:damage`;
	if (hasDamage && !processedRolls.has(damageKey)) {
		await ItemDurability.incrementDamageRolls(item);
		processedRolls.add(damageKey);
	}
});

/**
 * Track damage taken for equipped equipment
 */
Hooks.on("preUpdateActor", async (actor, changes, options, userId) => {
	// Only track for characters
	if (actor.type !== "character") return;

	// Check if HP is being changed
	if (changes.system?.attributes?.hp?.value === undefined) return;

	const oldHP = actor.system.attributes.hp.value;
	const newHP = changes.system.attributes.hp.value;

	// Only track when HP is reduced
	if (newHP >= oldHP) return;

	const damageTaken = oldHP - newHP;

	// Store the damage to apply after the update
	// We need to do this in preUpdate to get the correct old HP value
	options.durabilityDamageTaken = damageTaken;
});

Hooks.on("updateActor", async (actor, changes, options, userId) => {
	// Check if we stored damage to track
	if (!options.durabilityDamageTaken) return;

	// Get the damage and immediately delete it from options to prevent re-entry
	const damageTaken = options.durabilityDamageTaken;
	delete options.durabilityDamageTaken;

	// Add damage to all equipped equipment
	for (const item of actor.items) {
		if (item.type === "equipment" && item.system.equipped) {
			await ItemDurability.addDamageTaken(item, damageTaken);
		}
	}
});
