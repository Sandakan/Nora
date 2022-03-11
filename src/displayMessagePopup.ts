const alertContainer = document.querySelector('.alert-container') as HTMLElement;
const alertMessageContainer = document.querySelector('.alert-container .message') as HTMLElement;
const closeBtn = document.querySelector(
	'.alert-container .buttons-container .close-btn'
) as HTMLElement;

const closeAlertPopup = () => {
	if (alertContainer) {
		alertContainer.classList.remove('visible');
	}
};

export default (messageType = '', message = '', delay = 5000): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (alertContainer) {
			const classList = alertContainer.classList.value.split(' ');
			classList.splice(classList.indexOf('alert-container'), 1);
			alertContainer.classList.remove(...classList);
			alertContainer.classList.add('visible', messageType);
			alertMessageContainer.innerText = message;
			if (delay === 0)
				setTimeout(() => {
					closeAlertPopup();
					resolve();
				}, 5000);
			else
				setTimeout(() => {
					closeAlertPopup();
					resolve();
				}, delay);
			if (closeBtn) {
				closeBtn.addEventListener('click', (e) => {
					closeAlertPopup();
					resolve();
				});
			}
		} else reject("Alert container couldn't be found.");
	});
};
