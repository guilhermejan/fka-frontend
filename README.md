<p align="center">
  <img src="assets/images/logo.png" width="180" alt="Logo FKA Imports" />
</p>

# FKA Imports · Frontend

Interface do FKA Imports, projeto desenvolvido para uma empresa de importação de produtos. O frontend reúne o catálogo, páginas de acesso e um painel administrativo conectado à API do sistema.

## Funcionalidades

- Catálogo de produtos.
- Produtos em destaque.
- Avaliações de clientes.
- Área de acesso administrativo.
- Cadastro, edição e exclusão de produtos.
- Upload de imagens.
- Configurações e indicadores do painel.

## Tecnologias

- HTML
- CSS
- JavaScript
- API REST
- Netlify

## Como usar

### 1. Clone o repositório

```bash
git clone https://github.com/guilhermejan/fka-frontend.git
cd fka-frontend
```

### 2. Execute localmente

Abra a pasta no VS Code e inicie o `index.html` com a extensão **Live Server**.

O endereço da API fica em `js/api.js`. Para usar outro backend, altere o valor de `API_URL`.

## Estrutura

```text
fka-frontend/
├── assets/          # Imagens
├── css/             # Estilos do site e do painel
├── js/              # Integração com a API e comportamentos
├── acesso.html      # Área de acesso
├── fecca.html       # Página administrativa
├── index.html       # Catálogo
└── netlify.toml     # Configuração de publicação
```

## Backend

O servidor utilizado pelo projeto está em [fka-backend](https://github.com/guilhermejan/fka-backend).
