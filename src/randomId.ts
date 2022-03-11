export const generateRandomId = () => {
	const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	let tempName = '';
	for (let x = 0; x < 30; x++) {
		const val = Math.floor(Math.random() * (alphabet.length - 1) + 0);
		tempName += alphabet[val];
	}
	return tempName;
};
