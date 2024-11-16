import { connect } from "cloudflare:sockets";

export async function socks5Connect(addressType, addressRemote, portRemote, log, parsedSocks5Address) {
	try {
		const { hostname, port, username, password } = parsedSocks5Address;
		if (!hostname || !port) {
			throw new Error("Hostname e porta do servidor SOCKS5 s\xE3o obrigat\xF3rios");
		}
		const socket = connect({ hostname, port });
		const writer = socket.writable.getWriter();
		const reader = socket.readable.getReader();
		const socksGreeting = new Uint8Array([5, 1, username && password ? 2 : 0]);
		await writeWithTimeout(writer, socksGreeting, log, "Mensagem de sauda\xE7\xE3o SOCKS5 enviada");
		let res = await readWithTimeout(reader, log);
		if (res[0] !== 5) {
			throw new Error(`Erro na vers\xE3o do servidor SOCKS5: recebido ${res[0]}, esperado 5`);
		}
		if (res[1] === 255) {
			throw new Error("O servidor n\xE3o aceita nenhum m\xE9todo de autentica\xE7\xE3o");
		}
		if (res[1] === 2) {
			await authenticateWithUsernamePassword(writer, reader, username, password, log);
		} else if (res[1] !== 0) {
			throw new Error("O servidor n\xE3o aceita nenhum m\xE9todo de autentica\xE7\xE3o suportado");
		}
		const DSTADDR = createDstAddr(addressType, addressRemote, log);
		const socksRequest = new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 255]);
		await writeWithTimeout(writer, socksRequest, log, "Solicita\xE7\xE3o SOCKS5 enviada");
		res = await readWithTimeout(reader, log);
		if (res[1] !== 0) {
			throw new Error("Falha na conex\xE3o SOCKS5");
		}
		log("Conex\xE3o SOCKS5 estabelecida");
		writer.releaseLock();
		reader.releaseLock();
		return socket;
	} catch (error) {
		log(`Erro: ${error.message}`);
	}
}

async function authenticateWithUsernamePassword(writer, reader, username, password, log) {
	const usernameBytes = new TextEncoder().encode(username);
	const passwordBytes = new TextEncoder().encode(password);
	const authRequest = new Uint8Array(3 + usernameBytes.length + passwordBytes.length);
	authRequest[0] = 1;
	authRequest[1] = usernameBytes.length;
	authRequest.set(usernameBytes, 2);
	authRequest[2 + usernameBytes.length] = passwordBytes.length;
	authRequest.set(passwordBytes, 3 + usernameBytes.length);
	await writeWithTimeout(writer, authRequest, log, "Credenciais de autentica\xE7\xE3o enviadas");
	const res = await readWithTimeout(reader, log);
	if (res[1] !== 0) {
		throw new Error("Falha na autentica\xE7\xE3o do usu\xE1rio");
	}
	log("Autentica\xE7\xE3o bem-sucedida");
}

function createDstAddr(addressType, addressRemote, log) {
	let DSTADDR;
	switch (addressType) {
		case 1:
			DSTADDR = new Uint8Array([1, ...addressRemote.split(".").map(Number)]);
			break;
		case 2:
			DSTADDR = new Uint8Array([3, addressRemote.length, ...new TextEncoder().encode(addressRemote)]);
			break;
		case 3:
			DSTADDR = new Uint8Array([4, ...addressRemote.split(":").flatMap((x) => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]);
			break;
		default:
			throw new Error(`Tipo de endere\xE7o inv\xE1lido: ${addressType}`);
	}
	return DSTADDR;
}

export function socks5AddressParser(address) {
	let [latter, former] = address.split("@").reverse();
	let username, password, hostname, port;
	if (former) {
		const formers = former.split(":");
		if (formers.length !== 2) {
			throw new Error('Formato de endere\xE7o SOCKS inv\xE1lido: A parte de autentica\xE7\xE3o deve estar no formato "username:password"');
		}
		[username, password] = formers;
	}
	if (latter.includes("[")) {
		const match = latter.match(/\[([^\]]+)\]:(\d+)/);
		if (!match) {
			throw new Error('Formato de endere\xE7o SOCKS inv\xE1lido: Endere\xE7o IPv6 deve estar no formato "[ipv6]:porta"');
		}
		hostname = match[1];
		port = parseInt(match[2], 10);
	} else {
		const latters = latter.split(":");
		port = Number(latters.pop());
		if (isNaN(port)) {
			throw new Error("Formato de endere\xE7o SOCKS inv\xE1lido: O n\xFAmero da porta deve ser um n\xFAmero");
		}
		hostname = latters.join(":");
		if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) {
			throw new Error("Formato de endere\xE7o SOCKS inv\xE1lido: Endere\xE7os IPv6 devem estar entre colchetes, como [2001:db8::1]");
		}
	}
	return { username, password, hostname, port };
}

async function writeWithTimeout(writer, data, log, successMessage) {
	const timeout = 5e3;
	const writePromise = writer.write(data);
	const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout ao escrever dados")), timeout));
	await Promise.race([writePromise, timeoutPromise]);
	log(successMessage);
}

async function readWithTimeout(reader, log) {
	const timeout = 5e3;
	const readPromise = reader.read();
	const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout ao ler dados")), timeout));
	const result = await Promise.race([readPromise, timeoutPromise]);
	return result.value;
}