/**
 * Nyendra's Steew Cooker
 * Main entry point
 */

import { PlayerEquipmentViewer } from "./player-equipment-viewer.js";
import { DurabilityNamingConfig } from "./durability-naming-config.js";

// Log module initialization
Hooks.once("ready", () => {
  console.log("Nyendra's Steew Cooker | Module initialized");

  // Add global helpers for macros
  game.nyendrasSteewCooker = {
    openEquipmentViewer: () => {
      new PlayerEquipmentViewer().render(true);
    },
    openDurabilityConfig: () => {
      new DurabilityNamingConfig().render(true);
    }
  };
});
