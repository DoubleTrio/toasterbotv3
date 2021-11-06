function codeBlockList(items : string[], seperator = ', ') : string {
	return items.map((item) => `\`${item}\``).join(seperator);
}

export default codeBlockList;