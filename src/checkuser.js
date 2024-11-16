// Export the handleRequest function
export async function handleRequest(request, URL_LOGS, UUIDS_KV) {
    // Recupera a URL e extrai o UUID da URL (assumindo o formato /check/{uuid})
    const url = new URL(request.url);
    console.log(`URL Pathname: ${url.pathname}`); // Debugging statement
    const uuid = url.pathname.split("/")[3]; // Adjusted index to 3 to match /deviceid/check/{uuid}
    console.log(`Extracted UUID: ${uuid}`); // Debugging statement

    // Extrai o deviceId da query string
    const deviceId = url.searchParams.get("deviceId");
    console.log(`Extracted Device ID: ${deviceId}`); // Debugging statement

    if (!uuid || !deviceId) {
        return new Response("Faltando uuid ou deviceId na URL.", { status: 400 });
    }

    // Verifica se já existe o uuid no URL_LOGS, caso contrário, insere o uuid e o deviceId
    let existingDeviceIds = await URL_LOGS.get(uuid);

    if (!existingDeviceIds) {
        // Caso não haja dados, insere o uuid com o deviceId
        let deviceIds = [deviceId];
        await URL_LOGS.put(uuid, JSON.stringify(deviceIds)); // Salva no KV
    } else {
        // Caso já exista, realiza a verificação do limite de conexões
        let deviceIds = JSON.parse(existingDeviceIds);

        // Recupera os dados do UUIDS_KV para o uuid
        const hostData = await UUIDS_KV.get("UUIDS", { type: "json" });

        if (!hostData) {
            return new Response("Dados de host não encontrados.", { status: 404 });
        }

        // Encontra o objeto correspondente ao uuid
        const hostItem = hostData.find(item => item.uuid === uuid);

        if (!hostItem) {
            return new Response("UUID não encontrado no UUIDS_KV.", { status: 404 });
        }

        const { maxConnections } = hostItem;

        // Verifica a quantidade de deviceIds para esse uuid
        const currentConnections = deviceIds.length;

        // Caso não tenha excedido, adiciona o novo deviceId se ainda houver espaço
        if (!deviceIds.includes(deviceId)) {
            deviceIds.push(deviceId);
            await URL_LOGS.put(uuid, JSON.stringify(deviceIds)); // Atualiza o KV
        }

        // Atualiza o status de conexões ativas no UUIDS_KV
        hostItem.connectionsActive = deviceIds.length;

        // Atualiza os dados do UUIDS_KV com o novo número de conexões ativas
        await UUIDS_KV.put("UUIDS", JSON.stringify(hostData)); // Atualiza o KV com os dados modificados
    }

    // Recupera novamente os dados do UUIDS_KV para o uuid (pois pode ter sido modificado após a inserção de deviceId)
    const hostData = await UUIDS_KV.get("UUIDS", { type: "json" });

    if (!hostData) {
        return new Response("Dados de host não encontrados.", { status: 404 });
    }

    // Encontra o objeto correspondente ao uuid
    const hostItem = hostData.find(item => item.uuid === uuid);

    if (!hostItem) {
        return new Response("UUID não encontrado no UUIDS_KV.", { status: 404 });
    }

    // Retorna a resposta com os dados de conexão atualizados
    return returnResponseData(hostItem);
}

// Função para formatar a resposta com os dados necessários
function returnResponseData(hostItem) {
    const { prefixo, dataValidade } = hostItem;

    // Converte a data de validade para o formato correto "d/m/Y"
    const expirationDate = parseDate(dataValidade); // Função para converter data corretamente
    const formattedExpirationDate = `${expirationDate.getDate().toString().padStart(2, '0')}/${(expirationDate.getMonth() + 1).toString().padStart(2, '0')}/${expirationDate.getFullYear()}`;

    // Calcula a diferença de dias entre a data atual e a data de expiração
    const currentDate = new Date();
    const diffTime = expirationDate - currentDate;
    const expirationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Calculando os dias de diferença

    // Criar o objeto de resposta no formato desejado
    const responseData = {
        id: "01",
        username: prefixo, // Pode ajustar conforme seu campo
        count_connections: hostItem.connectionsActive, // Contagem de dispositivos ativos
        limit_connections: hostItem.maxConnections, // Limite de conexões
        expiration_date: formattedExpirationDate, // Data de expiração formatada
        expiration_days: expirationDays, // Dias até a expiração
    };

    // Definir a resposta com código 200 e conteúdo JSON
    return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

// Função para fazer o parse da data no formato dd/MM/yyyy
function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day); // O mês no JavaScript é zero-indexado
}