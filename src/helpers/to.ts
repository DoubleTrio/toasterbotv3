// Copied from https://github.com/scopsy/await-to-js

export async function to<T, U = Error> (
	promise: Promise<T>,
	errorExt?: Record<string, unknown>
): Promise<[U, undefined] | [null, T]> {
    try {
			const data = await promise;
			const result: [null, T] = [null, data];
			return result;
	} catch (err) {
			if (errorExt) {
				const parsedError = Object.assign({}, err, errorExt);
				return [parsedError, undefined];
			}
			const result_1: [U, undefined] = [err, undefined];
			return result_1;
	}
}
  
export default to;