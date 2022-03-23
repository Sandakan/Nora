declare module 'simple-get' {
	function concat(
		url: string,
		callback: (err: Error | null, res: any, data: Buffer) => any
	): any {}
}
