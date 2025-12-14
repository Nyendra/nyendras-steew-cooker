/**
 * Player Equipment Viewer
 * Displays all equipped weapons and equipment for each player in a tabbed dialog
 */

import { ItemDurability } from "./item-durability.js";

export class PlayerEquipmentViewer extends foundry.applications.api.HandlebarsApplicationMixin(
	foundry.applications.api.ApplicationV2
) {
	static DEFAULT_OPTIONS = {
		id: "player-equipment-viewer",
		window: {
			title: "Player Equipment Overview",
			resizable: true
		},
		position: {
			width: 700,
			height: 900
		},
		actions: {},
		form: {
			handler: undefined,
			closeOnSubmit: false
		}
	};

	static PARTS = {
		tabs: {
			template: "modules/nyendras-steew-cooker/templates/player-equipment-viewer.hbs"
		}
	};

	tabGroups = {
		players: "player-0"
	};

	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Get all player-owned characters
		const players = game.users.filter(u => !u.isGM);
		context.players = [];

		players.forEach((player, index) => {
			const character = player.character;
			if (!character) return;

			const playerData = {
				id: player.id,
				userId: player.id,
				name: player.name,
				characterName: character.name,
				weapons: [],
				equipment: []
			};

			// Get equipped items
			character.items.forEach(item => {
				if (!item.system.equipped) return;

				const durability = ItemDurability.getDurability(item);
				const itemData = {
					id: item.id,
					name: item.name,
					img: item.img,
					durability: durability,
					durabilityLabel: ItemDurability.getDurabilityLabel(durability),
					durabilityClass: ItemDurability.getDurabilityColorClass(durability),
					durabilityColor: ItemDurability.getDurabilityColor(durability),
					attackRolls: item.type === "weapon" ? ItemDurability.getAttackRolls(item) : null,
					damageRolls: item.type === "weapon" ? ItemDurability.getDamageRolls(item) : null,
					damageTaken: item.type === "equipment" ? ItemDurability.getDamageTaken(item) : null
				};

				// Add to appropriate category
				if (item.type === "weapon") {
					playerData.weapons.push(itemData);
				} else if (item.type === "equipment") {
					playerData.equipment.push(itemData);
				}
			});

			context.players.push(playerData);
		});

		return context;
	}

	_attachPartListeners(partId, htmlElement, options) {
		super._attachPartListeners(partId, htmlElement, options);

		// Handle player selection radio changes
		htmlElement.querySelectorAll('input[name="playerSelection"]').forEach(radio => {
			radio.addEventListener('change', (event) => {
				const isSelected = event.target.value === 'selected';
				const checkboxContainer = htmlElement.querySelector('.player-checkboxes');
				const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');

				checkboxContainer.setAttribute('data-enabled', isSelected);
				checkboxes.forEach(cb => cb.disabled = !isSelected);
			});
		});

		// Handle item selection radio changes
		htmlElement.querySelectorAll('input[name="itemSelection"]').forEach(radio => {
			radio.addEventListener('change', (event) => {
				const isSelected = event.target.value === 'selected';
				const checkboxes = htmlElement.querySelectorAll('.item-checkbox');

				checkboxes.forEach(cb => cb.disabled = !isSelected);
			});
		});

		// Handle reduce durability button
		const reduceBtn = htmlElement.querySelector('.reduce-durability-btn');
		if (reduceBtn) {
			reduceBtn.addEventListener('click', async (event) => {
				await this._handleReduceDurability(htmlElement);
			});
		}

		// Handle reset button
		const resetBtn = htmlElement.querySelector('.reset-btn');
		if (resetBtn) {
			resetBtn.addEventListener('click', (event) => {
				this._handleReset(htmlElement);
			});
		}

		// Handle close button
		const closeBtn = htmlElement.querySelector('.close-btn');
		if (closeBtn) {
			closeBtn.addEventListener('click', (event) => {
				this.close();
			});
		}

		// Handle reset stats buttons
		htmlElement.querySelectorAll('.reset-stats-btn').forEach(btn => {
			btn.addEventListener('click', async (event) => {
				event.stopPropagation();
				const itemId = btn.dataset.itemId;
				const playerId = btn.dataset.playerId;
				await this._handleResetStats(playerId, itemId);
			});
		});
	}

	async _handleReduceDurability(htmlElement) {
		const amount = parseInt(htmlElement.querySelector('input[name="durabilityAmount"]').value);
		const playerSelection = htmlElement.querySelector('input[name="playerSelection"]:checked').value;
		const itemSelection = htmlElement.querySelector('input[name="itemSelection"]:checked').value;

		if (!amount || amount <= 0) {
			ui.notifications.warn("Please enter a valid durability reduction amount.");
			return;
		}

		// Get selected players
		let selectedPlayerIds = [];
		if (playerSelection === 'selected') {
			const checked = htmlElement.querySelectorAll('input[name="selectedPlayers"]:checked');
			selectedPlayerIds = Array.from(checked).map(cb => cb.value);

			if (selectedPlayerIds.length === 0) {
				ui.notifications.warn("Please select at least one player.");
				return;
			}
		}

		// Get selected items if needed
		let selectedItemIds = [];
		if (itemSelection === 'selected') {
			const checked = htmlElement.querySelectorAll('.item-checkbox:checked');
			selectedItemIds = Array.from(checked).map(cb => cb.dataset.itemId);

			if (selectedItemIds.length === 0) {
				ui.notifications.warn("Please select at least one item.");
				return;
			}
		}

		// Process durability reduction
		const players = game.users.filter(u => !u.isGM);
		let itemsAffected = 0;

		for (const player of players) {
			// Check if this player should be processed
			if (playerSelection === 'selected' && !selectedPlayerIds.includes(player.id)) continue;

			const character = player.character;
			if (!character) continue;

			for (const item of character.items) {
				if (!item.system.equipped) continue;

				// Check item type filter
				if (itemSelection === 'weapons' && item.type !== 'weapon') continue;
				if (itemSelection === 'equipment' && item.type !== 'equipment') continue;
				if (itemSelection === 'selected' && !selectedItemIds.includes(item.id)) continue;
				if (item.type !== 'weapon' && item.type !== 'equipment') continue;

				// Reduce durability
				const currentDurability = ItemDurability.getDurability(item);
				const newDurability = Math.max(0, currentDurability - amount);
				await ItemDurability.setDurability(item, newDurability);
				itemsAffected++;
			}
		}

		ui.notifications.info(`Reduced durability by ${amount}% for ${itemsAffected} item(s).`);

		// Update durability values in the DOM without re-rendering
		for (const player of players) {
			const character = player.character;
			if (!character) continue;

			for (const item of character.items) {
				if (!item.system.equipped) continue;
				if (item.type !== 'weapon' && item.type !== 'equipment') continue;

				// Find the durability display for this item
				const itemElement = htmlElement.querySelector(`[data-item-id="${item.id}"]`);
				if (!itemElement) continue;

				const itemRow = itemElement.closest('.item-row');
				if (!itemRow) continue;

				// Update the percentage display
				const percentageElement = itemRow.querySelector('.item-percentage');
				if (percentageElement) {
					const newDurability = ItemDurability.getDurability(item);
					percentageElement.textContent = `${newDurability}%`;
				}

				// Update the status label
				const statusElement = itemRow.querySelector('.item-status');
				if (statusElement) {
					const newDurability = ItemDurability.getDurability(item);
					const newLabel = ItemDurability.getDurabilityLabel(newDurability);
					const newColor = ItemDurability.getDurabilityColor(newDurability);
					const newClass = ItemDurability.getDurabilityColorClass(newDurability);

					statusElement.textContent = newLabel;
					statusElement.className = `item-status ${newClass}`;
					statusElement.style.color = newColor;
					statusElement.style.backgroundColor = `${newColor}20`;
				}
			}
		}
	}

	_handleReset(htmlElement) {
		// Reset durability amount to 10
		const amountInput = htmlElement.querySelector('input[name="durabilityAmount"]');
		if (amountInput) amountInput.value = 10;

		// Reset player selection to "all"
		const playerAllRadio = htmlElement.querySelector('input[name="playerSelection"][value="all"]');
		if (playerAllRadio) playerAllRadio.checked = true;

		// Reset item selection to "all"
		const itemAllRadio = htmlElement.querySelector('input[name="itemSelection"][value="all"]');
		if (itemAllRadio) itemAllRadio.checked = true;

		// Disable and uncheck all player checkboxes
		const checkboxContainer = htmlElement.querySelector('.player-checkboxes');
		if (checkboxContainer) {
			checkboxContainer.setAttribute('data-enabled', 'false');
			const playerCheckboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
			playerCheckboxes.forEach(cb => {
				cb.disabled = true;
				cb.checked = false;
			});
		}

		// Disable and uncheck all item checkboxes
		const itemCheckboxes = htmlElement.querySelectorAll('.item-checkbox');
		itemCheckboxes.forEach(cb => {
			cb.disabled = true;
			cb.checked = false;
		});
	}

	async _handleResetStats(playerId, itemId) {
		// Get the player (user)
		const user = game.users.get(playerId);
		if (!user) return;

		// Get the character for this player
		const character = user.character;
		if (!character) return;

		// Get the item
		const item = character.items.get(itemId);
		if (!item) return;

		// Reset stats based on item type
		if (item.type === "weapon") {
			await ItemDurability.setAttackRolls(item, 0);
			await ItemDurability.setDamageRolls(item, 0);
			ui.notifications.info(`Reset attack and damage roll stats for ${item.name}.`);

			// Update the DOM directly
			const htmlElement = this.element;
			const itemRow = htmlElement.querySelector(`[data-item-id="${item.id}"]`)?.closest('.item-row');
			if (itemRow) {
				const statElements = itemRow.querySelectorAll('.item-stat');
				if (statElements[0]) statElements[0].textContent = 'A: 0';
				if (statElements[1]) statElements[1].textContent = 'D: 0';
			}
		} else if (item.type === "equipment") {
			await ItemDurability.setDamageTaken(item, 0);
			ui.notifications.info(`Reset damage taken for ${item.name}.`);

			// Update the DOM directly
			const htmlElement = this.element;
			const itemRow = htmlElement.querySelector(`[data-item-id="${item.id}"]`)?.closest('.item-row');
			if (itemRow) {
				const statElement = itemRow.querySelector('.item-stat');
				if (statElement) statElement.textContent = 'DMG: 0';
			}
		}
	}
}
