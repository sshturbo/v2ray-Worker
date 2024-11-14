# V2Ray Worker

Este projeto é um Cloudflare Worker para V2Ray, projetado para lidar com conexões V2Ray e gerenciar o acesso dos usuários através do armazenamento KV da Cloudflare.

## Propósito

O V2Ray Worker serve como um manipulador de proxy, gerenciando conexões de usuários e garantindo que o número de conexões ativas não exceda os limites especificados. Ele usa o armazenamento KV da Cloudflare para armazenar e recuperar dados de usuários e registros de conexão.

## Configuração

### Pré-requisitos

- Node.js e npm instalados
- Conta na Cloudflare
- Wrangler CLI instalado (`npm install -g wrangler`)

### Instalação

1. **Clone o repositório:**

```sh
git clone https://github.com/seu-usuario/v2ray-Worker.git
cd v2ray-Worker
```

2. **Instale as dependências:**

```sh
npm install
```

3. **Configure o Wrangler:**

```sh
wrangler login
wrangler config
```

4. **Edite o arquivo `wrangler.toml` com suas configurações:**

```toml
name = "v2ray-worker"
type = "javascript"
account_id = "seu-account-id"
workers_dev = true
kv_namespaces = [
    { binding = "KV_NAMESPACE", id = "seu-kv-namespace-id" }
]
```

5. **Implemente o Worker:**

```sh
wrangler publish
```

## Uso

Após a configuração e implantação, o V2Ray Worker estará ativo e pronto para gerenciar conexões V2Ray através da Cloudflare.

## Contribuição

1. Faça um fork do projeto
2. Crie uma nova branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adicione nova feature'`)
4. Envie para o branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.





















































