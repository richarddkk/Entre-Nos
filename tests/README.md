# Verificar as regras com o emulador (opcional)

Os testes normais do projeto, executados com `npm test`, verificam a lógica do jogo e não precisam do Firebase.

`firestore-rules.test.mjs` verifica as regras reais do Firestore em um emulador local. Inclui contas diferentes, isolamento das respostas, limite de duas pessoas, painel restrito ao criador, respostas duplicadas/atrasadas e criação de 64 perguntas no mesmo lote.

Essa suíte separada foi fornecida para você executar no seu ambiente; não foi executada nesta entrega. É necessário Java compatível com os emuladores atuais e o Firebase CLI.

Na pasta principal do projeto, instale as dependências de teste (não são necessárias para usar o site):

```bash
npm install --no-save firebase @firebase/rules-unit-testing
```

Inicie o emulador e execute a suíte isolada:

```bash
npx firebase-tools emulators:exec --only firestore --project demo-entre-nos "node --test tests/firestore-rules.test.mjs"
```

O prefixo `demo-` identifica um projeto de demonstração. Os testes apontam explicitamente para `127.0.0.1:8080`, limpam somente o banco desse emulador e não dependem do conteúdo de `src/firebase-config.js`. Não substitua esse identificador pelo seu projeto de produção.

O comando baixa ferramentas e o emulador caso não estejam instalados. Não publica o site nem aplica regras ao seu projeto real.
