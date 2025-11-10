/**
 * Chat Combat Color Fix
 * Colors AC display in chat based on attack hit/miss with configurable tie behavior
 */

Hooks.on('renderChatMessage', (message, html) => {

	/* Foundry (Ready Set Roll) */

	if (html[0].dataset.messageId !== '') {
		setTimeout(() => {
			const foundHtml = $('li[data-message-id="' + html[0].dataset.messageId + '"]');
			const diceTotal = foundHtml.find('.dice-total');
			const attacker = foundHtml.find('.title')[0].innerText;
			let attack = 0;
			let defender = '';
			let ac = 0;
			if (diceTotal.length > 0) {
				for (const dice of diceTotal) {
					const rolls = dice.innerText.split('\n');
					const diceRoll = rolls[1];
					if (diceRoll > 1 && diceRoll < 20) {
						dice.classList.remove('success', 'failure');
					}
					if (!dice.classList.contains('ignored')) {
						attack = rolls[0];
					}
				}
			}
			if (foundHtml.find('.ac').length > 0) {
				defender = foundHtml.find('.name')[0].innerText;
				ac = foundHtml.find('.ac')[0].children[1].innerText;
				const defenderWinsOnTie = game.settings.get("nyendras-steew-cooker", "defenderWinsOnTie");
				if ((defenderWinsOnTie && attack > ac) || (!defenderWinsOnTie && attack >= ac)) {
					foundHtml.find('.ac')[0].children[0].setAttribute('style', 'color: var(--dnd5e-color-failure-critical)');
					foundHtml.find('.ac')[0].children[1].setAttribute('style', 'color: var(--dnd5e-color-failure-critical)');
				} else {
					foundHtml.find('.ac')[0].children[0].setAttribute('style', 'color: var(--dnd5e-color-success-critical)');
					foundHtml.find('.ac')[0].children[1].setAttribute('style', 'color: var(--dnd5e-color-success-critical)');
				}
			}
			if (defender !== '') {
				console.log('Nyendra\'s Steew Cooker - Attacker: ' + attacker + ' (' + attack + ') - Defender: ' + defender + ' (' + ac + ')');
			}
		}, '50');
	}

	/* Foundry (no addons) */

	// let diceTotal = html.find(".dice-total");
	// if (diceTotal.length > 0) {
	// 	setTimeout(() => {
	// 		diceTotal[0].classList.remove('success', 'failure');
	// 		const attack = diceTotal[0].innerText;
	// 		if (html.find(".ac").length > 0) {
	// 			const ac = html.find(".ac")[0].children[1].innerText;
	// 			if (attack > ac) {
	// 				html.find(".ac")[0].children[0].setAttribute("style", "color: var(--dnd5e-color-failure-critical)");
	// 				html.find(".ac")[0].children[1].setAttribute("style", "color: var(--dnd5e-color-failure-critical)");
	// 			} else {
	// 				html.find(".ac")[0].children[0].setAttribute("style", "color: var(--dnd5e-color-success-critical)");
	// 				html.find(".ac")[0].children[1].setAttribute("style", "color: var(--dnd5e-color-success-critical)");
	// 			}
	// 		}
	// 	}, '500');
	// }
});
