/**
 * Chat Trash Icon
 * Adds a quick delete button to chat messages for GMs
 */

Hooks.on("renderChatMessage", (message, html) => {
  // Only show delete button if enabled and user is GM
  if (!game.settings.get("nyendras-steew-cooker", "enableChatTrashIcon")) return;
  if (!game.user.isGM) return;

  // Find the message header controls
  const messageHeader = html.find(".message-header");
  if (!messageHeader.length) return;

  // Create the delete button
  const deleteButton = $(`
    <a class="chat-delete-button" title="Delete Message">
      <i class="fas fa-trash"></i>
    </a>
  `);

  // Add click handler to delete without confirmation
  deleteButton.on("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await message.delete();
    } catch (error) {
      console.error("Failed to delete chat message:", error);
      ui.notifications.error("Failed to delete message");
    }
  });

  // Insert the delete button inside the message metadata span
  // This places it next to the context menu icon with proper padding
  const messageMetadata = messageHeader.find(".message-metadata");
  if (messageMetadata.length) {
    messageMetadata.append(deleteButton);
  } else {
    // Fallback: append to message header if metadata not found
    messageHeader.append(deleteButton);
  }
});
