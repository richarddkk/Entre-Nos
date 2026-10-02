# Atualizar com temas e preparar o GitHub Pages

Esta atualização não publicou nada. Ela adiciona um botão de modo claro/escuro no topo e prepara o projeto para o GitHub Pages.

## Atualizar sem perder sua configuração do Firebase

Se você já configurou seu projeto, mantenha seu `src/firebase-config.js` atual. O ZIP contém apenas o modelo, sem os dados que você preencheu no seu computador.

Você pode copiar somente estes arquivos novos/alterados para a sua pasta existente:

- `src/Game.tsx`
- `src/styles.css`
- `src/theme.mjs` (novo)
- `vite.config.ts`
- `index.html`
- `.github/workflows/pages.yml` (novo, para quando quiser hospedar)

Copie também a documentação se quiser. Os arquivos do banco e da autenticação não mudaram nesta atualização. O `index.html` já usa o caminho correto `/src/main.tsx`, sem espaços.

Salve e recarregue a página. Se o Vite pedir reinicialização, pressione Ctrl+C no terminal e execute `npm run dev` novamente.

## Botão de tema

O botão fica no canto superior direito, ao lado da conta. Mostra “Escuro” para mudar ao escuro e “Claro” para voltar ao claro. No celular, ele mostra o ícone de lua ou sol.

A primeira visita acompanha a preferência do sistema. Depois que você escolhe um tema, ele fica guardado no navegador daquele aparelho, inclusive após recarregar. Essa preferência não muda as perguntas, contas ou respostas no Firebase.

## Onde estão os domínios autorizados

São configurações do produto Authentication, não as configurações gerais do projeto.

1. Clique em **Authentication** no menu à esquerda.
2. Dentro de Authentication, abra a aba **Configurações / Settings** no topo.
3. Clique em **Domínios autorizados / Authorized domains**.
4. Adicione `localhost` se ainda não estiver na lista. Não coloque `http://` nem a porta.

Quando o site estiver no GitHub Pages, adicione também o domínio `SEU_USUARIO.github.io`. Não adicione o caminho do repositório.

## Hospedar depois pelo GitHub Pages

1. Primeiro finalize o Firebase conforme o README e confirme que funciona localmente.
2. Crie um repositório no GitHub e envie o conteúdo da pasta do projeto. `package.json`, `index.html` e `.github` precisam estar na raiz do repositório, não dentro de uma pasta extra.
3. Envie seu `src/firebase-config.js` configurado com o objeto Web do Firebase. Esse objeto é público; não use credenciais de service account ou chaves privadas.
4. Não envie `node_modules` nem `dist`. A configuração `.gitignore` já os exclui.
5. No repositório, abra **Settings > Pages**. Em **Source**, escolha **GitHub Actions**.
6. Vá à aba **Actions** e selecione **Publicar Entre Nos no GitHub Pages**.
7. Só quando estiver pronto, clique em **Run workflow**. Esse é o passo que publica o site. Nenhum push publica automaticamente com o arquivo fornecido.
8. Aguarde o processo terminar e abra o endereço mostrado no ambiente **github-pages** ou em **Settings > Pages**.
9. No Firebase Authentication, inclua `SEU_USUARIO.github.io` nos domínios autorizados.
10. Abra esse endereço, crie a sala e envie o convite à sua namorada. Agora os dois podem usar de redes diferentes.

O Vite está configurado com base relativa `./`. Os assets e os convites preservam o caminho do repositório, como `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

As perguntas e respostas continuam no Firebase. O GitHub Pages serve o site; não guarda senhas nem o histórico das conversas. As regras do Firestore continuam necessárias.

A ação foi fornecida como preparação e não foi executada. Para atualizações futuras, envie as alterações e execute **Run workflow** novamente quando quiser publicá-las.

Referências oficiais:

- https://vite.dev/guide/static-deploy
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://firebase.google.com/docs/auth/web/email-link-auth
