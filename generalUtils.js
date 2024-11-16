export function base64ToArrayBuffer(base64Str) {
	if (!base64Str) {
		return { error: null };
	}
	try {
		base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
		const decode = atob(base64Str);
		const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
		return { earlyData: arryBuffer.buffer, error: null };
	} catch (error) {
		return { error };
	}
}

export async function ADD(envadd) {
	var addtext = envadd.replace(/[	|"'\r\n]+/g, ",").replace(/,+/g, ",");
	if (addtext.charAt(0) == ",")
		addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == ",")
		addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split(",");
	return add;
}