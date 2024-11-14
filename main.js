var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js
import { connect } from "cloudflare:sockets";
import { handleRequest as checkUserHandler } from './checkuser.js';
import { socks5Connect, socks5AddressParser } from './socks5.js';
import { DNS_SERVERS, DNS_PORT, tryDNSServer, handleDNSQuery } from './dns.js';

var userID = "052f238a-ed91-4134-82c9-f158a8baf818";
var proxyIP = "";
var sub = "";
var subconverter = "subapi-loadbalancing.pages.dev";
var subconfig = "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini";
var socks5Address = "root:j96637116@144.22.184.144:1087";
if (!isValidUUID(userID)) {
	throw new Error("uuid n\xE3o \xE9 v\xE1lido");
}
var parsedSocks5Address = {};
var enableSocks = true;
var fakeUserID;
var fakeHostName;
var noTLS = "false";
var proxyIPs;
var addresses = [];
var addressescsv = [];
var DLS = 8;
var proxyhosts = [];
var proxyhostsURL = "https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/proxyhosts";
var RproxyIP = "false";
var worker_default = {
	/**
	 * @param {import("@cloudflare/workers-types").Request} request
	 * @param {{UUID: string, PROXYIP: string, URL_LOGS: KVNamespace, hostKv: KVNamespace}} env
	 * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		if (url.pathname.startsWith('/deviceid')) {
			// Use checkUserHandler for /check/* routes
			return await checkUserHandler(request, env.URL_LOGS, env.UUIDS_KV);
		}
		try {
			const UA = request.headers.get("User-Agent") || "null";
			const userAgent = UA.toLowerCase();
			userID = (env.UUID || userID).toLowerCase();
			const currentDate = /* @__PURE__ */ new Date();
			currentDate.setHours(0, 0, 0, 0);
			const timestamp = Math.ceil(currentDate.getTime() / 1e3);
			const fakeUserIDMD5 = await MD5MD5(`${userID}${timestamp}`);
			fakeUserID = fakeUserIDMD5.slice(0, 8) + "-" + fakeUserIDMD5.slice(8, 12) + "-" + fakeUserIDMD5.slice(12, 16) + "-" + fakeUserIDMD5.slice(16, 20) + "-" + fakeUserIDMD5.slice(20);
			fakeHostName = fakeUserIDMD5.slice(6, 9) + "." + fakeUserIDMD5.slice(13, 19);
			console.log(`Fake UUID: ${fakeUserID}`);
			proxyIP = env.PROXYIP || proxyIP;
			proxyIPs = await ADD(proxyIP);
			proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
			socks5Address = env.SOCKS5 || socks5Address;
			sub = env.SUB || sub;
			subconverter = env.SUBAPI || subconverter;
			if (subconverter.includes("http://")) {
				subconverter = subconverter.split("//")[1];
				subProtocol = "http";
			} else {
				subconverter = subconverter.split("//")[1] || subconverter;
			}
			subconfig = env.SUBCONFIG || subconfig;
			if (socks5Address) {
				try {
					parsedSocks5Address = socks5AddressParser(socks5Address);
					RproxyIP = env.RPROXYIP || "false";
					enableSocks = true;
				} catch (err) {
					let e = err;
					console.log(e.toString());
					RproxyIP = env.RPROXYIP || !proxyIP ? "true" : "false";
					enableSocks = false;
				}
			} else {
				RproxyIP = env.RPROXYIP || !proxyIP ? "true" : "false";
			}
			if (env.ADD)
				addresses = await ADD(env.ADD);
			if (env.ADDAPI)
				addressesapi = await ADD(env.ADDAPI);
			if (env.ADDNOTLS)
				addressesnotls = await ADD(env.ADDNOTLS);
			if (env.ADDNOTLSAPI)
				addressesnotlsapi = await ADD(env.ADDNOTLSAPI);
			if (env.ADDCSV)
				addressescsv = await ADD(env.ADDCSV);
			DLS = env.DLS || DLS;
			const upgradeHeader = request.headers.get("Upgrade");
			const url = new URL(request.url);
			if (url.searchParams.has("sub") && url.searchParams.get("sub") !== "")
				sub = url.searchParams.get("sub");
			if (url.searchParams.has("notls"))
				noTLS = "true";
			if (url.pathname === "/generate_uuid") {
				const newUUID = crypto.randomUUID();
				const randomPrefix = Math.random().toString(36).substring(2, 8);
				const validadeDate = /* @__PURE__ */ new Date();
				validadeDate.setDate(validadeDate.getDate() + 30);
				const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric"
				});
				const formattedDate = dateFormatter.format(validadeDate);
				const { maxConnections = 1 } = await request.json().catch(() => ({}));
				let uuidList2 = await env.UUIDS_KV.get("UUIDS", { type: "json" }) || [];
				uuidList2.push({ uuid: newUUID, prefixo: randomPrefix, dataValidade: formattedDate, maxConnections, connectionsActive: 0 });
				await env.UUIDS_KV.put("UUIDS", JSON.stringify(uuidList2));
				const redirectUrl = new URL(request.url);
				redirectUrl.pathname = `uuid/${newUUID}`;
				return Response.redirect(redirectUrl.toString(), 302);
			}
			const pathUUID = url.pathname.startsWith("/uuid/") ? url.pathname.slice(6) : null;
			if (pathUUID && isValidUUID(pathUUID)) {
				const uuidList2 = await env.UUIDS_KV.get("UUIDS", { type: "json" }) || [];
				const uuidEntry = uuidList2.find((item) => item.uuid === pathUUID);
				if (uuidEntry) {
					userID = pathUUID;
					const responseContent = await getVLESSConfig(userID, url.hostname, sub, UA, RproxyIP, url);
					return new Response(responseContent, { status: 200 });
				} else {
					return new Response("UUID n\xE3o encontrado", { status: 404 });
				}
			}
			const uuidList = await env.UUIDS_KV.get("UUIDS", { type: "json" }) || [];
			if (!upgradeHeader || upgradeHeader !== "websocket") {
				switch (url.pathname.toLowerCase()) {
					case `/uuid/${fakeUserID}`:
						const uuidDetails = uuidList.find((item) => item.uuid === fakeUserID);
						if (uuidDetails) {
							noTLS = "true";
							const fakeConfig = await getVLESSConfig(uuidDetails.uuid, request.headers.get("Host"), sub, "CF-Workers-SUB", RproxyIP, url);
							return new Response(`${fakeConfig}`, { status: 200 });
						} else {
							return new Response("Fake UUID n\xE3o encontrado", { status: 404 });
						}
					case `/list_uuid`:
						const detailedUuidList = uuidList.map((item) => ({
							uuid: item.uuid,
							prefixo: item.prefixo,
							dataValidade: item.dataValidade,
							maxConnections: item.maxConnections,
							connectionsActive: item.connectionsActive
						}));
						return new Response(JSON.stringify(detailedUuidList), { status: 200, headers: { "Content-Type": "application/json" } });
					default:
						return new Response("N\xE3o encontrado", { status: 404 });
				}
			} else {
				return await vlessOverWSHandler(request, env);
			}
		} catch (err) {
			let e = err;
			return new Response(e.toString());
		}
	}
};

async function vlessOverWSHandler(request) {
	const webSocketPair = new WebSocketPair();
	const [client, webSocket] = Object.values(webSocketPair);
	webSocket.accept();
	let address = "";
	let portWithRandomLog = "";
	const log = /* @__PURE__ */ __name((info, event) => {
		console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
	}, "log");
	const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
	const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);
	let remoteSocketWapper = {
		value: null
	};
	let isDns = false;
	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (isDns) {
				return await handleDNSQuery(chunk, webSocket, null, log);
			}
			if (remoteSocketWapper.value) {
				const writer = remoteSocketWapper.value.writable.getWriter();
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}
			const {
				hasError,
				message,
				addressType,
				portRemote = 443,
				addressRemote = "",
				rawDataIndex,
				vlessVersion = new Uint8Array([0, 0]),
				isUDP
			} = processVlessHeader(chunk);
			address = addressRemote;
			portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? "udp " : "tcp "} `;
			if (hasError) {
				throw new Error(message);
				return;
			}
			if (isUDP) {
				isDns = portRemote === 53;
			}
			const vlessResponseHeader = new Uint8Array([vlessVersion[0], 0]);
			const rawClientData = chunk.slice(rawDataIndex);
			if (isDns) {
				return handleDNSQuery(rawClientData, webSocket, vlessResponseHeader, log);
			}
			log(`Processando conex\xE3o de sa\xEDda TCP ${addressRemote}:${portRemote}`);
			handleTCPOutBound(remoteSocketWapper, addressType, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log);
		},
		close() {
			log(`readableWebSocketStream est\xE1 fechado`);
		},
		abort(reason) {
			log(`readableWebSocketStream foi abortado`, JSON.stringify(reason));
		}
	})).catch((err) => {
		log("Erro no pipeline readableWebSocketStream", err);
	});
	return new Response(null, {
		status: 101,
		// @ts-ignore
		webSocket: client
	});
}
__name(vlessOverWSHandler, "vlessOverWSHandler");

async function handleTCPOutBound(remoteSocket, addressType, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log) {
	async function connectAndWrite(address, port) {
		log(`conectado a ${address}:${port}`);
		const tcpSocket2 = await socks5Connect(addressType, address, port, log, parsedSocks5Address);
		remoteSocket.value = tcpSocket2;
		const writer = tcpSocket2.writable.getWriter();
		await writer.write(rawClientData);
		writer.releaseLock();
		return tcpSocket2;
	}
	__name(connectAndWrite, "connectAndWrite");
	let tcpSocket = await connectAndWrite(addressRemote, portRemote);
	remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null, log);
}
__name(handleTCPOutBound, "handleTCPOutBound");

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
	let readableStreamCancel = false;
	const stream = new ReadableStream({
		// Initialization function when the stream starts
		start(controller) {
			webSocketServer.addEventListener("message", (event) => {
				if (readableStreamCancel) {
					return;
				}
				const message = event.data;
				controller.enqueue(message);
			});
			webSocketServer.addEventListener("close", () => {
				safeCloseWebSocket(webSocketServer);
				if (readableStreamCancel) {
					return;
				}
				controller.close();
			});
			webSocketServer.addEventListener("error", (err) => {
				log("Ocorreu um erro no servidor WebSocket");
				controller.error(err);
			});
			const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
			if (error) {
				controller.error(error);
			} else if (earlyData) {
				controller.enqueue(earlyData);
			}
		},
		// Called when the consumer pulls data from the stream
		pull(controller) {
		},
		// Called when the stream is canceled
		cancel(reason) {
			if (readableStreamCancel) {
				return;
			}
			log(`O stream leg\xEDvel foi cancelado, o motivo \xE9 ${reason}`);
			readableStreamCancel = true;
			safeCloseWebSocket(webSocketServer);
		}
	});
	return stream;
}
__name(makeReadableWebSocketStream, "makeReadableWebSocketStream");

function processVlessHeader(vlessBuffer) {
	if (vlessBuffer.byteLength < 24) {
		return {
			hasError: true,
			message: "dados inv\xE1lidos"
		};
	}
	const version = new Uint8Array(vlessBuffer.slice(0, 1));
	let isValidUser = false;
	let isUDP = false;
	const requestUUID = stringify(new Uint8Array(vlessBuffer.slice(1, 17)));
	const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];
	const command = new Uint8Array(
		vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
	)[0];
	if (command === 1) {
	} else if (command === 2) {
		isUDP = true;
	} else {
		return {
			hasError: true,
			message: `comando ${command} n\xE3o \xE9 suportado, comando 01-tcp,02-udp,03-mux`
		};
	}
	const portIndex = 18 + optLength + 1;
	const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
	const portRemote = new DataView(portBuffer).getUint16(0);
	let addressIndex = portIndex + 2;
	const addressBuffer = new Uint8Array(
		vlessBuffer.slice(addressIndex, addressIndex + 1)
	);
	const addressType = addressBuffer[0];
	let addressLength = 0;
	let addressValueIndex = addressIndex + 1;
	let addressValue = "";
	switch (addressType) {
		case 1:
			addressLength = 4;
			addressValue = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			).join(".");
			break;
		case 2:
			addressLength = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
			)[0];
			addressValueIndex += 1;
			addressValue = new TextDecoder().decode(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			break;
		case 3:
			addressLength = 16;
			const dataView = new DataView(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(dataView.getUint16(i * 2).toString(16));
			}
			addressValue = ipv6.join(":");
			break;
		default:
			return {
				hasError: true,
				message: `tipo de endere\xE7o inv\xE1lido \xE9 ${addressType}`
			};
	}
	if (!addressValue) {
		return {
			hasError: true,
			message: `addressValue est\xE1 vazio, addressType \xE9 ${addressType}`
		};
	}
	return {
		hasError: false,
		addressRemote: addressValue,
		// Parsed remote address
		addressType,
		// Address type
		portRemote,
		// Remote port
		rawDataIndex: addressValueIndex + addressLength,
		// Actual starting position of the raw data
		vlessVersion: version,
		// VLESS protocol version
		isUDP
		// Whether it is a UDP request
	};
}
__name(processVlessHeader, "processVlessHeader");

async function remoteSocketToWS(remoteSocket, webSocket, vlessResponseHeader, retry, log) {
	let remoteChunkCount = 0;
	let chunks = [];
	let vlessHeader = vlessResponseHeader;
	let hasIncomingData = false;
	await remoteSocket.readable.pipeTo(
		new WritableStream({
			start() {
			},
			/**
			 * Process each data chunk
			 * @param {Uint8Array} chunk Data chunk
			 * @param {*} controller
			 */
			async write(chunk, controller) {
				hasIncomingData = true;
				if (webSocket.readyState !== WS_READY_STATE_OPEN) {
					controller.error(
						"webSocket.readyState n\xE3o est\xE1 aberto, talvez fechado"
					);
				}
				if (vlessHeader) {
					webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
					vlessHeader = null;
				} else {
					webSocket.send(chunk);
				}
			},
			close() {
				log(`remoteConnection!.readable est\xE1 fechado com hasIncomingData \xE9 ${hasIncomingData}`);
			},
			abort(reason) {
				console.error(`remoteConnection!.readable abortado`, reason);
			}
		})
	).catch((error) => {
		console.error(
			`remoteSocketToWS tem exce\xE7\xE3o `,
			error.stack || error
		);
		safeCloseWebSocket(webSocket);
	});
	if (hasIncomingData === false && retry) {
		log(`retry`);
		retry();
	}
}
__name(remoteSocketToWS, "remoteSocketToWS");

function base64ToArrayBuffer(base64Str) {
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
__name(base64ToArrayBuffer, "base64ToArrayBuffer");

function isValidUUID(uuid) {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}
__name(isValidUUID, "isValidUUID");

var WS_READY_STATE_OPEN = 1;
var WS_READY_STATE_CLOSING = 2;
function safeCloseWebSocket(socket) {
	try {
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close();
		}
	} catch (error) {
		console.error("erro safeCloseWebSocket", error);
	}
}
__name(safeCloseWebSocket, "safeCloseWebSocket");

var byteToHex = [];
for (let i = 0; i < 256; ++i) {
	byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
	return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
__name(unsafeStringify, "unsafeStringify");


function stringify(arr, offset = 0) {
	const uuid = unsafeStringify(arr, offset);
	if (!isValidUUID(uuid)) {
		throw TypeError(`UUID gerado n\xE3o est\xE1 em conformidade com a especifica\xE7\xE3o ${uuid}`);
	}
	return uuid;
}
__name(stringify, "stringify");

async function MD5MD5(text) {
	const encoder = new TextEncoder();
	const firstPass = await crypto.subtle.digest("MD5", encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	const secondPass = await crypto.subtle.digest("MD5", encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return secondHex.toLowerCase();
}
__name(MD5MD5, "MD5MD5");

async function ADD(envadd) {
	var addtext = envadd.replace(/[	|"'\r\n]+/g, ",").replace(/,+/g, ",");
	if (addtext.charAt(0) == ",")
		addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == ",")
		addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split(",");
	return add;
}
__name(ADD, "ADD");

var what_is_this_written_by = "dmxlc3M=";
function configuration(UUID, domainAddress) {
	const protocolType = atob(what_is_this_written_by);
	const alias = "VPN-PS";
	let address = "vivo.com.br";
	let port = 443;
	const userID2 = UUID;
	const encryptionMethod = "none";
	const transportProtocol = "ws";
	const disguiseDomain = domainAddress;
	const path = "/" + domainAddress;
	let transportSecurity = ["tls", true];
	const SNI = domainAddress;
	const fingerprint = "randomized";
	const v2ray = `${protocolType}://${userID2}@${address}:${port}?encryption=${encryptionMethod}&security=${transportSecurity[0]}&sni=${SNI}&fp=${fingerprint}&type=${transportProtocol}&host=${disguiseDomain}&path=${encodeURIComponent(path)}#${encodeURIComponent(alias)}`;
	return [v2ray];
}
__name(configuration, "configuration");

var subParams = ["v2ray"];
async function getVLESSConfig(userID2, hostName, sub2, UA, RproxyIP2, _url) {
	const userAgent = UA.toLowerCase();
	const Config = configuration(userID2, hostName);
	const v2ray = Config[0];
	let proxyhost = "";
	if (proxyhostsURL && (!proxyhosts || proxyhosts.length == 0)) {
		try {
			const response = await fetch(proxyhostsURL);
			if (!response.ok) {
				console.error("Erro ao buscar endere\xE7o:", response.status, response.statusText);
				return;
			}
			const text = await response.text();
			const lines = text.split("\n");
			const nonEmptyLines = lines.filter((line) => line.trim() !== "");
			proxyhosts = proxyhosts.concat(nonEmptyLines);
		} catch (error) {
		}
	}
	if (proxyhosts.length != 0)
		proxyhost = proxyhosts[Math.floor(Math.random() * proxyhosts.length)] + "";
	if (userAgent.includes("mozilla") && !subParams.some((_searchParams) => _url.searchParams.has(_searchParams))) {
		return `
################################################################
Endere\xE7o de assinatura de adapta\xE7\xE3o r\xE1pida:
---------------------------------------------------------------
${proxyhost}
---------------------------------------------------------------
################################################################
v2ray
---------------------------------------------------------------
${v2ray}
---------------------------------------------------------------
################################################################
`;
	} else {
		if (typeof fetch != "function") {
			return "Erro: fetch n\xE3o est\xE1 dispon\xEDvel neste ambiente.";
		}
		return v2ray;
	}
}
__name(getVLESSConfig, "getVLESSConfig");

export {
	worker_default as default
};
