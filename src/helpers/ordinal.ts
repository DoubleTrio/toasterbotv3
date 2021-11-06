function ordinal(num : number) : string {
	const parsed = num.toString();
	const lastDigit = parsed[parsed.length - 1];
	switch (lastDigit) {
		case '1':
			return parsed + 'st';
		case '2':
			return parsed + 'nd';
		case '3':
			return parsed + 'rd';
		default: 
			return parsed + 'th';
	}
}

export default ordinal;