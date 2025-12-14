/**
 * Durability Naming Configuration
 * Allows GMs to customize durability tier names and colors
 */

export class DurabilityNamingConfig extends foundry.applications.api.HandlebarsApplicationMixin(
	foundry.applications.api.ApplicationV2
) {
	static DEFAULT_OPTIONS = {
		id: "durability-naming-config",
		window: {
			title: "Durability Naming Configuration",
			resizable: true
		},
		position: {
			width: 600,
			height: 500
		},
		actions: {
			save: this._onSave,
			reset: this._onReset,
			addTier: this._onAddTier,
			removeTier: this._onRemoveTier
		},
		form: {
			handler: undefined,
			closeOnSubmit: false
		}
	};

	static PARTS = {
		form: {
			template: "modules/nyendras-steew-cooker/templates/durability-naming-config.hbs"
		}
	};

	static getDefaultTiers() {
		return [
			{ threshold: 100, name: "Good", color: "#18520b" },
			{ threshold: 75, name: "Worn", color: "#856404" },
			{ threshold: 50, name: "Slightly Damaged", color: "#cc6600" },
			{ threshold: 25, name: "Heavily Damaged", color: "#c92a2a" },
			{ threshold: 0, name: "Broken", color: "#c92a2a" }
		];
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Get current tiers from settings, or use defaults
		const tiers = game.settings.get("nyendras-steew-cooker", "durabilityTiers") || DurabilityNamingConfig.getDefaultTiers();
		const showNames = game.settings.get("nyendras-steew-cooker", "showDurabilityNames") || false;

		context.tiers = tiers.sort((a, b) => b.threshold - a.threshold); // Sort descending
		context.showNames = showNames;

		return context;
	}

	_attachPartListeners(partId, htmlElement, options) {
		super._attachPartListeners(partId, htmlElement, options);

		// Handle add tier button
		const addBtn = htmlElement.querySelector('.add-tier-btn');
		if (addBtn) {
			addBtn.addEventListener('click', () => this._onAddTier());
		}

		// Handle remove tier buttons
		htmlElement.querySelectorAll('.remove-tier-btn').forEach(btn => {
			btn.addEventListener('click', (event) => {
				const index = parseInt(event.currentTarget.dataset.index);
				this._onRemoveTier(index);
			});
		});

		// Handle save button
		const saveBtn = htmlElement.querySelector('.save-btn');
		if (saveBtn) {
			saveBtn.addEventListener('click', () => this._onSave(htmlElement));
		}

		// Handle reset button
		const resetBtn = htmlElement.querySelector('.reset-btn');
		if (resetBtn) {
			resetBtn.addEventListener('click', () => this._onReset());
		}
	}

	async _onSave(htmlElement) {
		const tiers = [];
		const rows = htmlElement.querySelectorAll('.table-row:not(.table-header)');

		rows.forEach(row => {
			const threshold = parseInt(row.querySelector('.tier-threshold-input').value);
			const name = row.querySelector('.tier-name-input').value;
			const color = row.querySelector('.tier-color-input').value;

			if (!isNaN(threshold) && name && color) {
				tiers.push({ threshold, name, color });
			}
		});

		// Sort tiers by threshold descending
		tiers.sort((a, b) => b.threshold - a.threshold);

		const showNames = htmlElement.querySelector('input[name="showNames"]').checked;

		await game.settings.set("nyendras-steew-cooker", "durabilityTiers", tiers);
		await game.settings.set("nyendras-steew-cooker", "showDurabilityNames", showNames);

		ui.notifications.info("Durability naming configuration saved.");

		// Re-render all open character sheets to show updated durability
		Object.values(ui.windows).forEach(app => {
			if (app.constructor.name === "ActorSheetV2" && app.actor?.type === "character") {
				app.render();
			}
		});

		this.render();
	}

	async _onReset() {
		const confirmed = await Dialog.confirm({
			title: "Reset to Defaults",
			content: "<p>Are you sure you want to reset durability naming to default values?</p>",
		});

		if (confirmed) {
			await game.settings.set("nyendras-steew-cooker", "durabilityTiers", DurabilityNamingConfig.getDefaultTiers());
			await game.settings.set("nyendras-steew-cooker", "showDurabilityNames", false);
			ui.notifications.info("Durability naming reset to defaults.");

			// Re-render all open character sheets
			Object.values(ui.windows).forEach(app => {
				if (app.constructor.name === "ActorSheetV2" && app.actor?.type === "character") {
					app.render();
				}
			});

			this.render();
		}
	}

	_onAddTier() {
		// Get current tiers
		const currentTiers = game.settings.get("nyendras-steew-cooker", "durabilityTiers") || DurabilityNamingConfig.getDefaultTiers();

		// Add a new tier with default values
		currentTiers.push({ threshold: 50, name: "New Tier", color: "#808080" });

		// Save and re-render
		game.settings.set("nyendras-steew-cooker", "durabilityTiers", currentTiers);
		this.render();
	}

	_onRemoveTier(index) {
		const currentTiers = game.settings.get("nyendras-steew-cooker", "durabilityTiers") || DurabilityNamingConfig.getDefaultTiers();

		if (currentTiers.length <= 1) {
			ui.notifications.warn("You must have at least one durability tier.");
			return;
		}

		currentTiers.splice(index, 1);
		game.settings.set("nyendras-steew-cooker", "durabilityTiers", currentTiers);
		this.render();
	}
}
