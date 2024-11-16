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

var subParams = ["v2ray"];
let proxyhostsURL = "https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/proxyhosts";
let proxyhosts = [];
export async function getVLESSConfig(userID2, hostName, sub2, UA, RproxyIP2, _url) {
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