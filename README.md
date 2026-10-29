# Sistema de Locação de Veículos

Aplicação web para uma locadora cadastrar veículos, controlar a disponibilidade da frota e registrar locações feitas por usuários autenticados. O projeto é composto por uma API REST em Node.js com Express, persistência em MySQL por meio do Prisma ORM, autenticação com JWT e uma interface em React.

Trabalho prático da disciplina Programação com Frameworks Web.

## Integrantes

| Nome completo | RA / Matrícula |
| --- | --- |
|  |  |
|  |  |
|  |  |
|  |  |

## Tecnologias

**Backend:** Node.js 22, Express 5, Prisma ORM 7 com o adaptador `@prisma/adapter-mariadb`, MySQL 8, jsonwebtoken, bcrypt, cors e dotenv. Os testes usam o executor nativo do Node (`node:test`).

**Frontend:** React 19, Vite 8, React Router 7, Fetch API e CSS convencional separado por área da aplicação.

## Organização das pastas

```text
locacao-veiculos/
  backend/
    prisma/
      schema.prisma          modelos, enum e relacionamentos
      migrations/            migrations versionadas
      seed.js                dados de demonstração
    prisma.config.js         caminho do schema, das migrations, do seed e da URL do banco
    src/
      routes/                mapeamento dos endpoints
      controllers/           leitura da requisição e resposta HTTP
      services/              validações, regras de negócio e acesso ao banco
      middlewares/           autenticação JWT e tratamento de erros
      lib/                   cliente Prisma e classe HttpError
      app.js                 configuração do Express
      server.js              inicialização do servidor
    tests/                   testes automatizados da API
  frontend/
    src/
      pages/                 telas da aplicação
      components/            componentes reutilizáveis
      contexts/              AuthContext (sessão do usuário)
      services/api.js        comunicação com a API
      utils/formatacao.js    formatação de moeda e datas
      styles/                arquivos CSS
      App.jsx                rotas da interface
      main.jsx               ponto de entrada
    tests/                   teste de integração com a API
```

## Entidades e relacionamentos

Os nomes abaixo são exatamente os usados no `schema.prisma`. Entre parênteses está o nome da tabela no MySQL, definido com `@@map`.

**Usuario** (`usuarios`)

| Campo | Tipo | Restrições |
| --- | --- | --- |
| id | Int | PK, autoincremento |
| nome | String (VARCHAR 120) | obrigatório |
| email | String (VARCHAR 160) | obrigatório, **único** |
| senha | String (VARCHAR 100) | hash bcrypt |
| dataCadastro | DateTime | padrão `now()` |

**Veiculo** (`veiculos`)

| Campo | Tipo | Restrições |
| --- | --- | --- |
| id | Int | PK, autoincremento |
| marca | String (VARCHAR 60) | obrigatório |
| modelo | String (VARCHAR 80) | obrigatório |
| placa | String (VARCHAR 7) | **única**, gravada em maiúsculas sem hífen |
| ano | Int | entre 1950 e o ano seguinte ao atual |
| valorDiaria | Decimal(10, 2) | maior que zero |
| disponivel | Boolean | padrão `true` |

**Locacao** (`locacoes`)

| Campo | Tipo | Restrições |
| --- | --- | --- |
| id | Int | PK, autoincremento |
| usuarioId | Int | FK para `usuarios.id` |
| veiculoId | Int | FK para `veiculos.id` |
| dataInicio | DateTime | obrigatório |
| dataPrevistaDevolucao | DateTime | posterior a `dataInicio` |
| dataDevolucao | DateTime? | opcional, preenchida na finalização |
| valorTotal | Decimal(10, 2) | calculado no backend |
| status | enum `StatusLocacao` | `ATIVA` (padrão) ou `FINALIZADA` |

**Relacionamentos**

* Usuario 1:N Locacao: `Usuario.locacoes Locacao[]` e `Locacao.usuario Usuario @relation(fields: [usuarioId], references: [id])`.
* Veiculo 1:N Locacao: `Veiculo.locacoes Locacao[]` e `Locacao.veiculo Veiculo @relation(fields: [veiculoId], references: [id])`.

No banco, a migration cria as chaves estrangeiras `locacoes_usuarioId_fkey` e `locacoes_veiculoId_fkey` com `ON DELETE RESTRICT`, o que impede apagar um usuário ou veículo que tenha histórico. Os campos de lista (`locacoes`) existem apenas no Prisma e permitem navegar pela relação em consultas com `include` ou `select`. Exemplo usado em `listarLocacoesDoUsuario` (`backend/src/services/locacao.service.js`):

```js
prisma.locacao.findMany({
  where: { usuarioId },
  include: { veiculo: { select: { id: true, marca: true, modelo: true, placa: true, ano: true, valorDiaria: true } } },
  orderBy: [{ status: 'asc' }, { dataInicio: 'desc' }],
});
```

## Funcionalidades

* Cadastro de usuário com validação de nome, e-mail e senha, senha armazenada com bcrypt.
* Login com retorno de JWT e dos dados públicos do usuário. O hash da senha nunca é retornado.
* Cadastro de veículo com placa única (normalizada para maiúsculas sem hífen ou espaços), ano válido e diária positiva.
* Listagem de todos os veículos e consulta somente dos disponíveis.
* Registro de locação com cálculo do valor no servidor e reserva exclusiva do veículo.
* Listagem das locações do usuário autenticado, com ativas e histórico de finalizadas, incluindo os dados do veículo.
* Finalização da locação com registro da data de devolução e liberação do veículo.
* Interface com cadastro, login, logout, painel, veículos, nova locação e minhas locações.

## Regras de negócio e onde estão no código

| Regra | Local |
| --- | --- |
| Somente usuários autenticados acessam veículos e locações | `router.use(autenticar)` em `veiculo.routes.js` e `locacao.routes.js` |
| Validação de cadastro e e-mail único | `registrarUsuario` em `auth.service.js` |
| Login, bcrypt e geração do JWT | `autenticarUsuario` em `auth.service.js` |
| Validação do JWT | `middlewares/autenticar.js` e `validarToken` em `auth.service.js` |
| Placa única, ano e diária | `cadastrarVeiculo` e `validarVeiculo` em `veiculo.service.js` |
| Datas da locação e veículo existente | `validarLocacao` e `registrarLocacao` em `locacao.service.js` |
| Cálculo das diárias e do valor | `calcularQuantidadeDiarias` e `calcularValorTotal` em `locacao.service.js` |
| Uma locação ativa por veículo | transação em `registrarLocacao` |
| Somente o dono finaliza e não finaliza duas vezes | `finalizarLocacao` em `locacao.service.js` |
| Respostas de erro padronizadas | `middlewares/tratarErros.js` e `lib/HttpError.js` |

### Cálculo do valor

```text
quantidadeDiarias = Math.ceil((dataPrevistaDevolucao - dataInicio) / 86400000)
valorTotal = quantidadeDiarias * valorDiaria
```

Qualquer fração de 24 horas conta como uma diária completa: 24 horas geram 1 diária, 25 horas geram 2. A multiplicação usa `Prisma.Decimal`, evitando erros de ponto flutuante. Se o cliente enviar `valorTotal` ou `usuarioId` no corpo da requisição, esses campos são ignorados: o controller só repassa `veiculoId`, `dataInicio` e `dataPrevistaDevolucao`, e o usuário vem do token.

## Fluxos principais

### Registro de locação

1. Em `NovaLocacao.jsx`, o usuário escolhe um veículo disponível e as datas. Os campos são controlados pelo estado `formulario`, atualizado pela função `atualizarCampo` no evento `onChange`.
2. No envio (`onSubmit`), a função `enviar` valida as datas, desabilita o botão com o estado `enviando` e chama `locacoesApi.registrar`, que faz `POST /api/locacoes` com o cabeçalho `Authorization: Bearer <token>`.
3. `locacao.routes.js` executa o middleware `autenticar`, que valida o token e coloca o usuário em `req.usuario`.
4. `locacaoController.registrar` extrai `veiculoId`, `dataInicio` e `dataPrevistaDevolucao` do corpo e chama `locacaoService.registrarLocacao(req.usuario.id, dados)`.
5. O service valida o id e as datas (400), busca o veículo (404 se não existir) e calcula o valor total.
6. Dentro de `prisma.$transaction`, o service reserva o veículo com uma atualização condicional e cria a locação com `include` do veículo. Se a reserva não afetar nenhuma linha, responde 409 com a mensagem `Veículo indisponível para locação.` e nada é gravado.
7. O controller responde 201 com a locação criada. A tela mostra o resumo com o valor retornado pelo servidor, limpa o formulário e recarrega a lista de veículos disponíveis.

### Finalização

`PATCH /api/locacoes/:id/finalizar` passa pelo mesmo middleware. `finalizarLocacao` busca a locação (404 se não existir), confere se pertence ao usuário do token (403) e se ainda está ativa (409). Em seguida, dentro de uma transação, muda o status para `FINALIZADA` com `updateMany({ where: { id, status: 'ATIVA' } })`, registra `dataDevolucao` e marca o veículo como disponível. A locação continua gravada, o que preserva o histórico.

### Login e validação do JWT

`autenticarUsuario` busca o usuário pelo e-mail e compara a senha informada com o hash usando `bcrypt.compare`. Se estiver correta, gera um token com `jwt.sign({ sub: usuario.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`. O bcrypt é usado porque gera um hash lento e com salt, de modo que um vazamento do banco não revela as senhas. A senha é removida da resposta porque o hash não tem utilidade para o cliente e facilitaria ataques de força bruta caso fosse exposto.

O middleware `autenticar` lê o cabeçalho `Authorization`, exige o formato `Bearer <token>`, chama `validarToken` (que usa `jwt.verify` e confere assinatura e expiração) e busca o usuário no banco com `buscarUsuarioPorId`. Se faltar o token, se ele for inválido ou expirado, ou se o usuário não existir mais, a resposta é 401.

### Controle de concorrência

Consultar `disponivel` antes de criar a locação não basta, porque duas requisições podem ler `true` ao mesmo tempo. Por isso a reserva é feita com uma atualização condicional dentro da transação:

```js
tx.veiculo.updateMany({ where: { id: veiculoId, disponivel: true }, data: { disponivel: false } });
```

O MySQL (InnoDB) bloqueia a linha do veículo durante essa atualização. A primeira transação muda `disponivel` para `false`. A segunda espera o bloqueio, reavalia a condição, encontra `false` e afeta zero linhas. O service verifica `reserva.count === 0`, lança o erro 409 e a transação é desfeita. Como a reserva e o `create` da locação estão na mesma transação, ou as duas coisas acontecem, ou nenhuma.

A finalização usa a mesma ideia com `status: 'ATIVA'` na condição, então duas finalizações simultâneas da mesma locação resultam em um único sucesso.

O teste `aceita apenas uma de várias locações simultâneas para o mesmo veículo` dispara seis requisições ao mesmo tempo contra o MySQL real e confere que só uma recebe 201. Com a versão ingênua (consultar e depois gravar) o mesmo teste falha, com as seis requisições aceitas.

### Interface React

* `AuthContext` guarda o usuário logado, oferece `login` e `logout` e, ao abrir a aplicação, valida o token salvo chamando `GET /api/auth/me`.
* `services/api.js` concentra as chamadas `fetch`, envia o token e transforma respostas de erro em exceções com a mensagem da API. Quando uma requisição com token recebe 401, o contexto encerra a sessão e redireciona para o login com o aviso recebido, o que cobre tokens expirados.
* `RotaProtegida` impede acesso às telas internas sem sessão.
* Após cadastrar veículo, registrar locação ou finalizar locação, a tela recarrega os dados da API para refletir o estado real do banco.

## Requisitos

* Node.js 20.19 ou superior (o projeto foi testado com Node.js 22)
* MySQL 8
* npm

## Configuração do MySQL

Crie um usuário e os bancos de desenvolvimento e de testes. Exemplo:

```sql
CREATE USER 'locacao'@'localhost' IDENTIFIED BY 'escolha-uma-senha';
CREATE DATABASE locacao_veiculos;
CREATE DATABASE locacao_veiculos_test;
GRANT ALL PRIVILEGES ON locacao_veiculos.* TO 'locacao'@'localhost';
GRANT ALL PRIVILEGES ON locacao_veiculos_test.* TO 'locacao'@'localhost';
```

Para criar novas migrations com `npx prisma migrate dev`, o Prisma precisa de um banco temporário (shadow database). Nesse caso, conceda também permissão de criar bancos ao usuário, por exemplo `GRANT CREATE, DROP ON *.* TO 'locacao'@'localhost';`. Para apenas executar o projeto isso não é necessário.

## Variáveis de ambiente

Copie os arquivos de exemplo e preencha os valores:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**backend/.env**

| Variável | Descrição |
| --- | --- |
| DATABASE_URL | conexão com o banco de desenvolvimento, no formato `mysql://usuario:senha@localhost:3306/locacao_veiculos` |
| TEST_DATABASE_URL | conexão com o banco usado pelos testes; precisa ser diferente de `DATABASE_URL`, pois os testes apagam os dados |
| JWT_SECRET | chave usada para assinar os tokens |
| JWT_EXPIRES_IN | validade do token, por exemplo `2h` |
| PORT | porta da API, padrão 3333 |
| TEST_PORT | porta da API de testes usada pelo teste do frontend, padrão 3334 |
| FRONTEND_URL | origem liberada no CORS, padrão `http://localhost:5173` |
| DEMO_USER_EMAIL | e-mail do usuário de demonstração criado pelo seed (opcional) |
| DEMO_USER_PASSWORD | senha do usuário de demonstração (opcional) |

**frontend/.env**

| Variável | Descrição |
| --- | --- |
| VITE_API_URL | endereço da API, padrão `http://localhost:3333/api` |

## Instalação e execução

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

O `npm install` do backend executa `prisma generate` automaticamente. `npm run db:migrate` aplica as migrations versionadas em `prisma/migrations` (`prisma migrate deploy`). `npm run db:seed` cadastra os veículos de exemplo e, se `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD` estiverem preenchidos, um usuário de demonstração com uma locação finalizada no histórico. O seed pode ser executado mais de uma vez sem duplicar dados. A API fica disponível em `http://localhost:3333/api`.

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A interface fica disponível em `http://localhost:5173`.

Para entrar com o usuário de demonstração, use o e-mail e a senha definidos em `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD` no `backend/.env`. Também é possível criar uma conta pela tela de cadastro.

Para produção, use `npm start` no backend e `npm run build` no frontend.

## Endpoints

Todas as rotas usam o prefixo `/api`. As rotas marcadas com JWT exigem o cabeçalho `Authorization: Bearer <token>`. Os erros são retornados no formato `{ "erro": "mensagem" }`.

| Método | Rota | JWT | Descrição | Sucesso | Erros |
| --- | --- | --- | --- | --- | --- |
| POST | /auth/register | não | cadastra usuário `{ nome, email, senha }` | 201 | 400, 409 |
| POST | /auth/login | não | autentica `{ email, senha }` e retorna `{ token, usuario }` | 200 | 400, 401 |
| GET | /auth/me | sim | dados do usuário autenticado | 200 | 401 |
| POST | /veiculos | sim | cadastra `{ marca, modelo, placa, ano, valorDiaria }` | 201 | 400, 401, 409 |
| GET | /veiculos | sim | lista todos os veículos | 200 | 401 |
| GET | /veiculos/disponiveis | sim | lista os veículos disponíveis | 200 | 401 |
| POST | /locacoes | sim | registra `{ veiculoId, dataInicio, dataPrevistaDevolucao }` | 201 | 400, 401, 404, 409 |
| GET | /locacoes | sim | lista as locações do usuário com o veículo | 200 | 401 |
| PATCH | /locacoes/:id/finalizar | sim | finaliza a locação | 200 | 400, 401, 403, 404, 409 |

Erros inesperados retornam 500 com a mensagem `Erro interno do servidor.`, sem expor detalhes; o erro completo é registrado no console do servidor.

Exemplo de demonstração com curl:

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email","senha":"sua-senha"}'

curl http://localhost:3333/api/veiculos/disponiveis -H "Authorization: Bearer TOKEN"

curl -X POST http://localhost:3333/api/locacoes \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"veiculoId":1,"dataInicio":"2026-11-10T09:00:00-03:00","dataPrevistaDevolucao":"2026-11-12T10:00:00-03:00"}'

curl -X PATCH http://localhost:3333/api/locacoes/1/finalizar -H "Authorization: Bearer TOKEN"
```

As datas são enviadas no formato ISO 8601. Os campos `Decimal` (`valorDiaria` e `valorTotal`) chegam no JSON como texto, por exemplo `"129.9"`, e a interface os formata em reais.

## Testes

**Backend:** usa o banco definido em `TEST_DATABASE_URL`. O script aplica as migrations nesse banco e executa os testes, que limpam as tabelas antes de cada caso.

```bash
cd backend
npm test
```

Os testes ficam em `backend/tests` e cobrem cadastro e login, e-mail duplicado, senha incorreta, rejeição sem JWT, cadastro de veículo, placa duplicada, diária inválida, listagem de disponíveis, cálculo de uma diária e de frações, criação de locação, datas inválidas, veículo indisponível e inexistente, locações simultâneas, isolamento das locações por usuário, finalização por outro usuário, finalização, segunda finalização, finalizações simultâneas, disponibilidade restaurada e preservação do histórico.

**Frontend:** o teste carrega o próprio `src/services/api.js` pelo Vite e executa o fluxo completo contra uma API real ligada ao banco de testes. Inicie essa API em um terminal e rode o teste em outro:

```bash
cd backend
npm run start:teste
```

```bash
cd frontend
npm test
```

## Decisões de implementação

* Prisma 7 exige um adaptador de driver; o MySQL é acessado com `@prisma/adapter-mariadb`, configurado em `src/lib/prisma.js` a partir da `DATABASE_URL`. A URL usada pelo CLI do Prisma fica em `prisma.config.js`.
* Valores monetários usam `Decimal(10, 2)` no banco e `Prisma.Decimal` nos cálculos.
* A placa é normalizada antes de validar e gravar, então `abc-1d23` e `ABC1D23` são a mesma placa. São aceitos os formatos antigo (`ABC1234`) e Mercosul (`ABC1D23`).
* O status da locação é um enum (`ATIVA` e `FINALIZADA`) para deixar explícito o estado e permitir a atualização condicional na finalização.
* O e-mail é gravado em minúsculas, o que evita duplicidade por diferença de caixa.
* A finalização devolve 403 quando a locação existe mas pertence a outro usuário, e 404 quando ela não existe.
* O token é guardado no `localStorage` do navegador, o que mantém a sessão ao recarregar a página.
* Não há edição ou exclusão de veículos e locações, conforme o enunciado.
