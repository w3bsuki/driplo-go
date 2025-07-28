export function clickOutside(node: HTMLElement, callback: () => void) {
	function handleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		
		// Check if the click is outside the dropdown and not on the categories button
		if (!node.contains(target) && !target.closest('button[data-categories-button]')) {
			callback();
		}
	}

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}