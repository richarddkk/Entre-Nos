# Entre Nós — versão independente com Firebase

Site para casal, responsivo, com cartões de perguntas e respostas compartilhadas em tempo real. Este pacote é para você executar e editar por conta própria. Nenhum comando deste projeto publica o site automaticamente.

## O que está pronto

- Visual para computador e celular.
- 64 perguntas iniciais, divididas em 8 categorias: Fofas, Nos conhecer, Quem é mais provável?, O que prefere?, Provocantes, Intimidade, Desejos e Safadas (18+).
- Seleção de uma categoria ou mistura de todas.
- Conta por e-mail e senha, recuperação de senha e sessão mantida pelo Firebase Authentication.
- Salas com apenas duas pessoas, acessadas por convite.
- Respostas atualizadas em tempo real pelo Cloud Firestore, sem precisar atualizar a página.
- Histórico das perguntas e respostas.
- Painel de perguntas para quem criou a sala: adicionar, editar, mudar categoria e remover do jogo.
- Dados isolados por sala. Não é necessário cadastrar um administrador separado.
- Regras que limitam a leitura das perguntas e respostas aos participantes da sala e a edição das perguntas ao criador.

## 1. Abrir e executar no VS Code

Instale o Node.js 22.13 ou superior (Node 24 também funciona). Abra a pasta `entre-nos-firebase` no VS Code e execute no terminal:

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador. Não abra `index.html` por duplo clique: use o servidor do Vite.

Antes de configurar o Firebase, você pode navegar pelas categorias e testar a prévia dos cartões. A prévia não salva respostas nem simula outra pessoa.

## 2. Criar seu projeto Firebase

1. Abra https://console.firebase.google.com/ e crie um projeto.
2. Em **Configurações do projeto > Seus aplicativos**, registre um aplicativo Web (ícone `</>`).
3. Copie o objeto `firebaseConfig` fornecido pelo Firebase.
4. Abra `src/firebase-config.js` e substitua os valores de exemplo pelos valores desse objeto. Preserve o `export const firebaseConfig = ...`.
5. Salve o arquivo. Se necessário, recarregue a página.

Exemplo de estrutura (use os valores reais do seu projeto):

```js
export const firebaseConfig = {
  apiKey: 'valor-do-seu-projeto',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  storageBucket: 'valor-fornecido-pelo-firebase',
  messagingSenderId: 'valor-do-seu-projeto',
  appId: 'valor-do-seu-projeto'
};
```

O objeto de configuração Web é público. A proteção dos dados depende da autenticação e das regras do Firestore. Não coloque credenciais de service account ou chave privada neste arquivo.

## 3. Ativar as contas

No Firebase Console:

1. Abra **Authentication** e inicialize o serviço.
2. Em **Sign-in method / Método de login**, ative **E-mail/Senha**.
3. Salve.
4. Para desenvolvimento, confira **Settings / Configurações > Authorized domains / Domínios autorizados** e inclua `localhost` se necessário. Projetos recentes podem não incluí-lo automaticamente.

O aplicativo usa e-mail e senha, sem depender de conta do ChatGPT. Você e sua namorada precisam criar contas diferentes. As senhas são gerenciadas pelo Firebase Authentication; não são salvas em documentos do Firestore.

## 4. Criar o banco e aplicar as regras

1. Abra **Firestore Database** no Firebase Console.
2. Crie um banco **Cloud Firestore padrão**, escolha uma região e inicie em modo de produção.
3. Abra a aba **Rules / Regras**.
4. Substitua o conteúdo pelo arquivo `firestore.rules` deste pacote.
5. Clique em **Publish / Publicar** nessa aba para aplicar as regras do BANCO. Isso não publica nem hospeda o site.

Não deixe regras abertas como `allow read, write: if true`. As regras incluídas fazem parte do funcionamento do projeto.

Não é preciso criar coleções manualmente nem importar as 64 perguntas. Ao criar a primeira sala, o aplicativo grava a sala, suas perguntas e o primeiro cartão em uma única operação.

O arquivo `firestore.indexes.json` não exige índices compostos. A lista de salas usa o índice de campo simples padrão de `memberIds`.

## 5. Usar com sua namorada

1. Cada um cria uma conta ou entra com sua própria conta.
2. Você clica em **Criar nossa sala**, escolhe um apelido e cria a sala.
3. Clique em **Convidar meu amor** e envie o link.
4. Ela abre o link, entra na conta dela, informa o apelido e entra na sala.
5. Cada um responde no próprio aparelho. As duas respostas aparecem na conversa da rodada.
6. O histórico fica em **Nossas conversas**.
7. O criador vê **Perguntas** no menu e pode organizar o catálogo daquela sala.

O convite reserva a segunda vaga para a primeira conta diferente que entrar. Envie apenas para sua namorada. Depois de preenchida a segunda vaga, outras contas não entram. Quem já participa pode voltar à sala ao entrar novamente na mesma conta.

A categoria escolhida vale para o próximo cartão. Os cartões jogados não se repetem na seleção normal. Ao esgotar uma categoria, escolha outra ou adicione perguntas.

## 6. Testar no celular sem publicar

Para testar na mesma rede Wi-Fi:

1. Deixe `npm run dev` em execução no computador.
2. No Windows, execute `ipconfig` e procure o IPv4 da conexão Wi-Fi, por exemplo `192.168.1.10`.
3. No celular, conectado ao mesmo Wi-Fi, abra `http://192.168.1.10:5173` (substitua pelo IP real).
4. Se o Windows perguntar sobre o firewall, permita o Node.js somente na rede privada em que está testando.
5. Abra também esse endereço com o IP no computador antes de copiar o convite. Um convite com `localhost` aponta para o próprio aparelho de quem o abre e não funciona no celular.

Em HTTP com IP local, o navegador pode impedir a cópia automática. Nesse caso, selecione e copie o link do convite manualmente. Ambos os aparelhos precisam de internet para acessar o Firebase.

Fora da mesma rede, será necessário um endereço acessível pelos dois, configurado por você. Este pacote não cria nem publica esse endereço.

## 7. Onde alterar cada coisa

| Arquivo | Responsabilidade |
| --- | --- |
| `src/Game.tsx` | Interface, formulários, cartões e navegação |
| `src/styles.css` | Cores, fontes, tamanhos e adaptação ao celular |
| `src/questions.ts` | Categorias e perguntas iniciais das novas salas |
| `src/firebase-config.js` | Configuração do seu projeto Firebase |
| `src/firebase-service.js` | Contas, acesso ao Firestore, transações e atualizações em tempo real |
| `src/game-logic.mjs` | Escolha de cartões e validação do jogo |
| `firestore.rules` | Regras de autorização e validação dos dados |
| `firestore.indexes.json` | Configuração de índices |
| `tests/game.test.mjs` | Testes da lógica do jogo |
| `tests/firestore-rules.test.mjs` | Testes das regras para executar com o emulador |
| `firebase.json` | Configuração das regras e dos emuladores; não contém configuração de hospedagem |
| `index.html` | Página inicial, título e ícone |

Alterar `src/questions.ts` muda as perguntas iniciais das próximas salas. Para modificar uma sala existente, use o painel **Perguntas** do próprio site. Remover uma pergunta impede novos sorteios; os cartões e respostas anteriores ficam preservados.

As categorias íntimas iniciais são sugestivas e sem descrições explícitas. Você pode editar os cartões no painel respeitando os limites combinados entre vocês.

## 8. Como os dados são organizados

```text
rooms/{roomId}
  ownerId, guestId, memberIds, ownerName, guestName,
  currentRound, category, roundCount, createdAt

rooms/{roomId}/questions/{questionId}
  content, category, active

rooms/{roomId}/rounds/{roundId}
  questionId, content, category, created_at,
  answers: { uidDaPessoa: { content, created_at } }
```

Cada rodada guarda uma cópia da pergunta. Isso evita que a edição de uma pergunta altere conversas antigas. Cada resposta é associada ao UID autenticado, não ao apelido digitado.

O documento principal da sala permite leitura autenticada por quem conhece o código aleatório do convite e contém apenas apelidos e metadados. As subcoleções de perguntas e rodadas exigem que a conta pertença à sala. A lista geral de salas de outras pessoas não é permitida.

## 9. Testes e build local

```bash
npm test
npm run build
npm run preview
```

`npm run build` gera `dist/` localmente. `npm run preview` serve essa versão no computador. Nenhum desses comandos faz publicação.

Foram verificados a compilação TypeScript, o build e os testes da lógica (categorias, perguntas removidas, fim do catálogo, respostas atrasadas, validação do texto e limite de participantes). A conexão com seu projeto Firebase depende dos seus dados de configuração; não foi possível verificá-la com um projeto seu, pois eles não foram fornecidos.

Para verificar as regras em um ambiente isolado, há uma suíte separada com instruções em `tests/README.md`. Ela não usa dados de produção.

Checklist após configurar seu Firebase:

- Criar duas contas diferentes e uma sala.
- Entrar com a segunda conta pelo convite.
- Enviar uma resposta em cada aparelho e conferir atualização em ambos.
- Atualizar a página e conferir o histórico.
- Adicionar, editar e remover uma pergunta com a conta criadora.
- Confirmar que uma terceira conta não entra e que a segunda conta não edita perguntas.

## 10. Problemas comuns

- **“Configure src/firebase-config.js”**: os valores de exemplo ainda não foram substituídos.
- **“Ative E-mail/Senha”**: habilite esse provedor no Firebase Authentication.
- **“Acesso negado”**: confira se as regras foram aplicadas no mesmo projeto de `projectId` e no banco padrão.
- **Erro de API key**: copie novamente a configuração do aplicativo Web correto.
- **Celular não abre o site**: confira Wi-Fi, IP, porta, servidor em execução e firewall.
- **“Esta sala já tem duas pessoas”**: entre com uma das contas participantes ou crie outra sala.
- **As duas telas mostram a mesma pessoa**: use contas distintas. Para testar no mesmo computador, use navegadores ou perfis separados; abas do mesmo navegador compartilham a sessão.
- **“A pergunta mudou”**: alguém avançou a rodada. A resposta atrasada não é enviada; o rascunho fica associado ao cartão anterior.
- **Copiar convite não funciona no IP local**: copie o texto do campo manualmente.

## Tecnologias e referências

React + TypeScript + Vite. Firebase Authentication e Cloud Firestore pelo SDK modular oficial 12.19.0, carregado da CDN do Google. É necessário acesso à internet para carregar esse SDK e comunicar com o Firebase. Não há servidor próprio, Cloud Functions, banco SQL ou vínculo com Sites/ChatGPT nesta versão.

As fontes visuais são carregadas do Google Fonts, com alternativa local do sistema quando indisponíveis.

Referências oficiais usadas na configuração:

- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/web/alt-setup
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/faq-and-troubleshooting
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/security/rules-fields
- https://firebase.google.com/docs/firestore/manage-data/transactions
