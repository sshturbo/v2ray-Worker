import { connect } from "cloudflare:sockets";

export const DNS_SERVERS = [
    { hostname: "8.8.8.8", provider: "Google" },
    { hostname: "8.8.4.4", provider: "Google" },
    { hostname: "1.1.1.1", provider: "Cloudflare" }
];

export const DNS_PORT = 53;

export async function tryDNSServer(serverInfo, udpChunk, webSocket, vlessHeader, log) {
    const tcpSocket = connect({
        hostname: serverInfo.hostname,
        port: DNS_PORT
    });
    log(`Conectado a ${serverInfo.hostname}:${DNS_PORT} (${serverInfo.provider})`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(udpChunk);
    writer.releaseLock();
    return tcpSocket;
}

export async function handleDNSQuery(udpChunk, webSocket, vlessResponseHeader, log) {
    let lastError = null;
    let vlessHeader = vlessResponseHeader;
    for (const dnsServer of DNS_SERVERS) {
        try {
            const tcpSocket = await tryDNSServer(dnsServer, udpChunk, webSocket, vlessHeader, log);
            await tcpSocket.readable.pipeTo(new WritableStream({
                async write(chunk) {
                    if (webSocket.readyState === WS_READY_STATE_OPEN) {
                        if (vlessHeader) {
                            webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
                            vlessHeader = null;
                        } else {
                            webSocket.send(chunk);
                        }
                    }
                },
                close() {
                    log(`Conex\xE3o TCP do servidor DNS (${dnsServer.hostname}) est\xE1 fechada`);
                },
                abort(reason) {
                    console.error(`Conex\xE3o TCP do servidor DNS (${dnsServer.hostname}) abortada`, reason);
                }
            }));
            return;
        } catch (error) {
            lastError = error;
            log(`Falha ao conectar com ${dnsServer.hostname}: ${error.message}`);
            continue;
        }
    }
    console.error(`Todos os servidores DNS falharam. \xDAltimo erro: ${lastError.message}`);
}