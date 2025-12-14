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
