# Camera Grid OBS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma aplicação pública e independente que recebe até nove webcams pelo VDO.Ninja, permite compor um layout local e fornece uma saída transparente e sem áudio para o OBS.

**Architecture:** Monorepo npm com React/TypeScript/Vite, domínio compartilhado e servidor Node.js local em loopback. VDO.Ninja transporta o vídeo; WebSocket local transporta somente estado de layout e presença entre painel e saída OBS. A execução para após a prova técnica se os contratos reais do VDO.Ninja não sustentarem vídeo sem áudio, atualização sem reload ou revogação conforme definida.

**Tech Stack:** Node.js 22 LTS, npm workspaces, React, TypeScript, Vite, Fastify, WebSocket, Zod, Vitest, Testing Library, Playwright, react-rnd após checagem de compatibilidade, VDO.Ninja iframe API, OBS Studio no teste manual.

**Spec:** `docs/superpowers/specs/2026-10-30-camera-grid-obs-design.md`

## Global Constraints

- Projeto e histórico Git independentes; nenhum código ou dado do Projeto Ville.
- Até nove participantes; coordenadas canônicas `1920 × 1080`.
- VDO.Ninja transporta somente vídeo; `audiodevice=0` no publicador e `noaudio` no receptor.
- Nunca conceder `microphone` no atributo `allow` dos iframes.
- Não usar infraestrutura própria de vídeo, serviço pago obrigatório ou domínio obrigatório.
- Painel e saída rodam localmente; convidado precisa de página HTTPS pública.
- WebSocket local escuta em `127.0.0.1`; somente painel autorizado altera estado.
- Identidade usa convite individual e IDs criptográficos; nome e ordem de entrada não definem slot.
- Não recriar iframe ao mover/redimensionar; persistir somente no fim do gesto ou com debounce.
- Não tratar ocultação visual como revogação de acesso.
- Não afirmar vídeo real, transparência OBS ou ausência de áudio com base apenas em mocks.
- Não versionar senhas, tokens, URLs privadas, salas reais, layouts pessoais, logs, builds ou mídia.
- Publicar código no GitHub não autoriza publicar o site de convidados.

## Review Focus

- Convite revogado tenta entrar novamente em navegador novo: negar aprovação local de publicação, não apenas ocultar a câmera; acesso VDO direto permanece limitação explícita — Task 2 e Gate A.
- Usuário nega câmera ou a câmera está ocupada: explicar o erro sem solicitar microfone — Task 5.
- WebSocket cai durante um arraste e retorna com revisão antiga: recuperar snapshot e rejeitar mutação obsoleta — Task 3 e Task 4.
- Participante reconecta com o mesmo convite enquanto outro stream ocupa o ID: preservar slot e mostrar conflito recuperável — Task 9.
- Layout importado contém NaN, coordenadas fora de 1920 × 1080 ou IDs duplicados: rejeitar atomicamente sem alterar estado — Task 8.

---

## File Map

```text
camera-grid-obs/
├── apps/
│   ├── server/src/
│   │   ├── app.ts                 # composição HTTP/WS
│   │   ├── auth.ts                # capacidades e origem loopback
│   │   ├── layout-store.ts        # persistência atômica
│   │   ├── invite-service.ts      # emissão/revogação de convites
│   │   ├── session-service.ts     # estado/revisões/comandos
│   │   └── ws-gateway.ts          # protocolo WebSocket
│   └── web/src/
│       ├── routes/GuestPage.tsx   # entrada e publicação de câmera
│       ├── routes/ControlPage.tsx # painel do dono
│       ├── routes/OutputPage.tsx  # saída limpa do OBS
│       ├── composition/           # canvas, caixas e propriedades
│       ├── vdo/                   # iframes e postMessage
│       └── ws/                    # cliente de estado local
├── packages/
│   ├── domain/src/                # schemas, reducers, coordenadas, convites
│   ├── protocol/src/              # mensagens WS versionadas
│   └── vdo/src/                   # URLs/contratos VDO.Ninja
├── tests/e2e/                     # painel/saída em contextos separados
├── docs/manual-tests/             # roteiros Windows, OBS e webcams
├── docs/vdo-ninja-contract.md     # evidência oficial e limitações
├── package.json
├── package-lock.json
├── tsconfig.base.json
└── .github/workflows/ci.yml
```

### Task 1: Repositório, contrato VDO.Ninja e gate de acesso

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `README.md`
- Create: `packages/vdo/src/url-builder.ts`, `packages/vdo/src/contracts.ts`, `packages/vdo/test/url-builder.test.ts`
- Create: `docs/vdo-ninja-contract.md`, `docs/adr/0001-invite-revocation-boundary.md`
- Create: `docs/manual-tests/technical-spike-windows.md`

**Interfaces:**
- Produces: `buildGuestUrl(input: GuestUrlInput): URL`, `buildViewerUrl(input: ViewerUrlInput): URL`, `VdoMessageSchema`, e a decisão documentada do Gate A.

- [ ] **Step 1: Inicializar o Git independente e o workspace mínimo**

Criar branch `codex/technical-spike`, workspaces `apps/*` e `packages/*`, scripts `typecheck`, `test`, `build` e `.gitignore` cobrindo `node_modules`, `dist`, `.env*`, logs, mídia e `data/`, preservando apenas `.env.example` se necessário.

- [ ] **Step 2: Escrever testes que fixam URLs sem áudio**

Em `url-builder.test.ts`, testar que `buildGuestUrl` contém `push`, `room`, `password`, `audiodevice=0`, `webcam2`, qualidade/fps allowlisted e nunca inclui capacidade administrativa; testar que `buildViewerUrl` contém `view`/`scene`, `noaudio`, `cleanoutput` e bitrate allowlisted.

- [ ] **Step 3: Rodar o teste para confirmar falha**

Run: `npm test --workspace @camera-grid/vdo -- --run`
Expected: FAIL porque os builders ainda não existem.

- [ ] **Step 4: Implementar os builders e schemas mínimos**

Usar `URL`/`URLSearchParams`, origem configurável com padrão `https://vdo.ninja`, allowlist explícita e tipos sem campo livre de query string.

- [ ] **Step 5: Documentar somente contratos oficiais confirmados**

Registrar URL oficial, data da consulta, categoria sender/viewer, parâmetros `audiodevice=0`, `noaudio`, `cleanoutput`, qualidade/bitrate, scene/director e mensagens iframe usadas. Marcar qualquer comando sem confirmação como proibido.

- [ ] **Step 6: Investigar revogação por convite e registrar a limitação**

Provar documentalmente se VDO.Ninja oferece revogação individual persistente. A documentação atual indica senha por sala, lobby/transfer e desconexão, mas não uma lista de convites individualmente revogáveis que impeça reutilização direta.

- [ ] **Step 7: Executar Gate A antes de qualquer painel completo**

Apresentar ao usuário uma das interpretações/alterações:

1. **Lobby/transfer VDO.Ninja:** convite revogado ainda pode chegar ao lobby; a aplicação nunca o aprova novamente, sem prometer bloqueio de acesso VDO direto com dados de destino retidos; ou
2. **Broker público mínimo:** endpoint HTTPS não-vídeo valida tokens revogáveis antes de entregar uma autorização de entrada, reconhecendo que impedir reutilização de uma URL VDO já revelada ainda exige lobby/rotação.

Não seguir para Task 2 até o usuário escolher e o ADR registrar a semântica exata de “impedir conexão”.

- [ ] **Step 8: Rodar validação e commit**

Run: `npm run typecheck && npm test && npm run build`
Expected: todos PASS; nenhum segredo detectado por `git grep` de padrões definidos no README.

```bash
git add .
git commit -m "chore: establish VDO contract and access gate"
```

### Task 2: Domínio de sessão, convites e revogação

**Files:**
- Create: `packages/domain/src/session.ts`, `invite.ts`, `layout.ts`, `commands.ts`, `index.ts`
- Create: `packages/domain/test/invite.test.ts`, `layout.test.ts`, `commands.test.ts`
- Modify: `docs/adr/0001-invite-revocation-boundary.md`

**Interfaces:**
- Consumes: decisão do Gate A.
- Produces: `Invite`, `Participant`, `CameraLayout`, `SessionState`, `LayoutCommand`, `reduceSession(state, command)`, `canEnterProduction(invite, now)`.

- [ ] **Step 1: Escrever testes de identidade e revogação**

Cobrir: token individual não depende de nome; mesma identidade preserva slot; toda publicação/reconexão exige aprovação explícita; `REVOKED` bloqueia novas aprovações locais; `HIDDEN` mantém convite válido e apenas remove renderização; bloqueio de visualização é independente; queda de diretor/servidor fecha aprovações por padrão; regenerar convite invalida a geração anterior; `END_SESSION` revoga convites ativos e bloqueia novos comandos sem apagar o último layout.

- [ ] **Step 2: Escrever testes de layout canônico**

Cobrir exatamente nove slots, coordenadas 1920 × 1080, clamps, proporção, z-order, lock, `cover|contain`, mirror e política `hide|placeholder`.

- [ ] **Step 3: Rodar testes e confirmar falhas**

Run: `npm test --workspace @camera-grid/domain -- --run`
Expected: FAIL por tipos/reducer ausentes.

- [ ] **Step 4: Implementar schemas Zod e reducer puro**

Todos os comandos carregam `expectedRevision`; stale revision retorna erro tipado `STALE_STATE` sem mutar o estado.

- [ ] **Step 5: Implementar IDs e tokens criptográficos**

Usar `crypto.randomUUID()`/`randomBytes`; persistir apenas hash do token quando o mecanismo escolhido no Gate A permitir.

- [ ] **Step 6: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/domain -- --run`
Expected: PASS.

```bash
git add packages/domain docs/adr/0001-invite-revocation-boundary.md
git commit -m "feat: model stable participants and revocable invites"
```

### Task 3: Servidor local, persistência e protocolo WebSocket

**Files:**
- Create: `packages/protocol/src/messages.ts`, `packages/protocol/test/messages.test.ts`
- Create: `apps/server/src/app.ts`, `auth.ts`, `layout-store.ts`, `invite-service.ts`, `session-service.ts`, `ws-gateway.ts`, `main.ts`
- Create: `apps/server/test/auth.test.ts`, `layout-store.test.ts`, `ws-gateway.test.ts`

**Interfaces:**
- Consumes: `SessionState`, `LayoutCommand`, `reduceSession`.
- Produces: `createServer(config): FastifyInstance`, `LayoutStore.load/save`, protocolo `hello|snapshot|command|commandResult|presence` versão 1 e rotas locais `POST /api/sessions`, `POST /api/invites/:id/revoke`, `POST /api/sessions/:id/end`, `GET /output/:id`.

- [ ] **Step 1: Testar autorização e loopback**

Painel com capacidade válida pode mutar; convidado, saída, origem externa ou capacidade inválida recebem `FORBIDDEN`; leitura da saída não concede escrita.

- [ ] **Step 2: Testar persistência atômica e recuperação**

Salvar via arquivo temporário + rename; JSON truncado mantém último snapshot válido; nenhum write ocorre para estado semanticamente igual.

- [ ] **Step 3: Testar WebSocket entre contextos separados**

Dois clientes recebem snapshot; comando do painel atualiza saída; revisão obsoleta é rejeitada; reconexão recebe snapshot atual.

- [ ] **Step 4: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/server -- --run`
Expected: FAIL por servidor ausente.

- [ ] **Step 5: Implementar servidor mínimo em `127.0.0.1`**

Porta configurável, CORS allowlist local, limite de payload, Zod nas fronteiras, logs com redaction e diretório de dados fora do Git.

- [ ] **Step 6: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/server -- --run`
Expected: PASS.

```bash
git add apps/server packages/protocol
git commit -m "feat: add authorized local layout synchronization"
```

### Task 4: Vertical slice painel → WebSocket → saída

**Files:**
- Create: `apps/web/src/main.tsx`, `router.tsx`, `ws/client.ts`, `ws/useSession.ts`
- Create: `apps/web/src/routes/ControlPage.tsx`, `routes/OutputPage.tsx`
- Create: `apps/web/src/composition/LogicalCanvas.tsx`, `CameraBox.tsx`
- Create: `apps/web/test/coordinates.test.tsx`, `stable-camera-box.test.tsx`
- Create: `tests/e2e/panel-output-sync.spec.ts`

**Interfaces:**
- Consumes: protocolo WS v1 e `CameraLayout`.
- Produces: `previewToLogical(point, viewport)`, `logicalToPreview(rect, viewport)`, rotas `/control` e `/output` sincronizadas.

- [ ] **Step 1: Testar conversão de coordenadas**

Cobrir viewports 1920×1080, 960×540 e letterbox não 16:9; ida e volta deve preservar coordenadas dentro de tolerância de 0,5 px lógico.

- [ ] **Step 2: Testar identidade estável do componente**

Mover/redimensionar altera style, mas não desmonta `CameraBox` identificado por `participantId`.

- [ ] **Step 3: Testar sincronização E2E com dois contextos**

Abrir `/control` e `/output` em contexts Playwright separados; arrastar placeholder; saída atualiza sem reload; convidado/saída não conseguem enviar comando administrativo.

- [ ] **Step 4: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/web -- --run && npm run test:e2e -- panel-output-sync.spec.ts`
Expected: FAIL por UI ausente.

- [ ] **Step 5: Implementar vertical slice com placeholder**

Usar CSS transform/size sobre canvas lógico; persistir ao finalizar gesto e transmitir deltas durante gesto.

- [ ] **Step 6: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/web -- --run && npm run test:e2e -- panel-output-sync.spec.ts`
Expected: PASS sem qualquer iframe de vídeo ainda.

```bash
git add apps/web tests/e2e
git commit -m "feat: synchronize panel and OBS layout shell"
```

### Task 5: Página do convidado e publicação sem áudio

**Files:**
- Create: `apps/web/src/routes/GuestPage.tsx`
- Create: `apps/web/src/vdo/VdoPublisherFrame.tsx`, `vdo/post-message.ts`
- Create: `apps/web/test/guest-page.test.tsx`, `vdo-publisher-frame.test.tsx`, `post-message.test.ts`
- Modify: `packages/vdo/src/contracts.ts`

**Interfaces:**
- Consumes: `buildGuestUrl`, convite válido conforme Gate A.
- Produces: `VdoPublisherFrame`, `validateVdoMessage(event, frameWindow)`, estados `idle|preview|publishing|denied|busy|disconnected`.

- [ ] **Step 1: Testar iframe e permissões**

Assert `allow` contém `camera`, `autoplay`, `fullscreen` e não contém `microphone`; URL contém `audiodevice=0`; nenhuma API local chama `getUserMedia({audio:true})`.

- [ ] **Step 2: Testar postMessage seguro**

Rejeitar origem diferente de VDO, janela diferente do iframe e payload inválido; enviar sempre com `targetOrigin` exato.

- [ ] **Step 3: Testar UX de autorização e erros**

Exigir clique explícito; mostrar aviso de live pública; sanitizar nome; diferenciar câmera negada, ocupada e queda; oferecer desligar e sair.

- [ ] **Step 4: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/web -- --run guest-page vdo-publisher post-message`
Expected: FAIL.

- [ ] **Step 5: Implementar o mínimo**

Não receber streams de outros participantes. Não incluir senha/capacidade administrativa em logs, DOM visível ou analytics.

- [ ] **Step 6: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/web -- --run`
Expected: PASS.

```bash
git add apps/web packages/vdo
git commit -m "feat: add video-only guest publishing flow"
```

### Task 6: Saída VDO transparente e prova técnica real

**Files:**
- Create: `apps/web/src/vdo/VdoViewerFrame.tsx`, `vdo/VdoSceneFrame.tsx`
- Create: `apps/web/test/vdo-viewer-frame.test.tsx`, `output-page.test.tsx`
- Modify: `apps/web/src/routes/OutputPage.tsx`
- Create: `docs/manual-tests/results/technical-spike-template.md`
- Create after evidence: `docs/adr/0002-vdo-receiver-strategy.md`

**Interfaces:**
- Consumes: `buildViewerUrl`, `CameraLayout`, WS snapshot.
- Produces: saída transparente com receptor estável; ADR escolhe `native-scene` ou `individual-viewers`.

- [ ] **Step 1: Testar estrutura da saída**

HTML/root/canvas transparentes; 1920×1080; sem controls/scrollbar; frame mutado; URL `noaudio&cleanoutput`; alteração de layout não muda `src` nem key.

- [ ] **Step 2: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/web -- --run vdo-viewer output-page`
Expected: FAIL.

- [ ] **Step 3: Implementar cena e viewer mínimos atrás de feature flag**

Permitir comparar cena nativa e viewer individual sem alterar o contrato da rota `/output`.

- [ ] **Step 4: Rodar testes automatizados**

Run: `npm run typecheck && npm test && npm run build && npm run test:e2e -- panel-output-sync.spec.ts`
Expected: PASS; isto ainda não prova WebRTC/OBS.

- [ ] **Step 5: Executar teste manual Windows com uma webcam real**

Seguir `docs/manual-tests/technical-spike-windows.md` e registrar: navegador/OBS/version, URL redigida, vídeo recebido, transparência, movimento sem reload, contagem de PeerConnections, tracks de áudio enviadas/recebidas igual a zero, CPU/banda e reconexão.

- [ ] **Step 6: Executar teste manual de revogação conforme Gate A**

Revogar convite com participante conectado, fechar câmera e tentar reconexão em janela anônima. Tentar também com informações de destino obtidas antes da revogação. Registrar separadamente: decisão local de publicação, acesso VDO direto, autorização de visualização e renderização no layout. Repetir após queda/reinício do diretor e servidor local, e provar que convidado autorizado preserva slot mas exige nova aprovação.

- [ ] **Step 7: Executar Gate B**

Se qualquer requisito falhar ou depender de API inexistente, parar; registrar limitação e proposta no ADR; obter aprovação do usuário antes do painel completo.

- [ ] **Step 8: Escolher estratégia por evidência e commit**

ADR compara compatibilidade visual, reloads, CPU, banda e comportamento no Chromium do OBS. Não marcar manual PASS sem evidência preenchida.

```bash
git add apps/web docs/manual-tests docs/adr/0002-vdo-receiver-strategy.md
git commit -m "feat: prove video-only OBS output path"
```

### Task 7: Editor completo de composição

**Files:**
- Create: `apps/web/src/composition/CameraLayer.tsx`, `PropertyPanel.tsx`, `LayerList.tsx`, `PresetToolbar.tsx`
- Create: `apps/web/src/composition/preset-eight-sides.ts`
- Create: `apps/web/test/editor.test.tsx`, `preset-eight-sides.test.ts`
- Modify: `apps/web/src/routes/ControlPage.tsx`, `routes/OutputPage.tsx`

**Interfaces:**
- Consumes: estratégia aprovada no Gate B, `CameraLayout`, `LayoutCommand`.
- Produces: controles completos e `createEightSidesPreset(): CameraLayout[]`.

- [ ] **Step 1: Verificar manutenção/compatibilidade da biblioteca drag/resize**

Registrar versão, suporte React/TypeScript, licença e comportamento de aspect ratio; se `react-rnd` não atender, registrar alternativa antes de instalar.

- [ ] **Step 2: Testar preset e comandos do editor**

Quatro câmeras à esquerda, quatro à direita, centro livre e nona livre; cobrir X/Y/W/H, lock, aspect, z-order, visibility, label, border, radius, mirror e cover/contain. Cobrir também criação/encerramento de sessão, cópia de convite individual e cópia da URL somente leitura do OBS.

- [ ] **Step 3: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/web -- --run editor preset-eight-sides`
Expected: FAIL.

- [ ] **Step 4: Implementar controles e canvas escalado**

Campos numéricos e drag/resize emitem os mesmos comandos; clamp ocorre no domínio; iframes permanecem montados.

- [ ] **Step 5: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/web -- --run && npm run test:e2e -- panel-output-sync.spec.ts`
Expected: PASS.

```bash
git add apps/web package.json package-lock.json
git commit -m "feat: add nine-camera composition editor"
```

### Task 8: Presets e importação/exportação validada

**Files:**
- Create: `packages/domain/src/layout-file.ts`, `packages/domain/test/layout-file.test.ts`
- Create: `apps/web/src/composition/LayoutFileControls.tsx`, `apps/web/test/layout-file-controls.test.tsx`
- Modify: `apps/server/src/layout-store.ts`

**Interfaces:**
- Produces: `LayoutFileSchemaV1`, `parseLayoutFile(text): Result<LayoutFileV1>`, `serializeLayoutFile(layout): string`.

- [ ] **Step 1: Testar arquivo válido e entradas hostis**

Rejeitar schema desconhecido, NaN/Infinity, fora dos limites, IDs/slots duplicados, mais de nove câmeras e propriedades extras; falha não altera estado atual.

- [ ] **Step 2: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/domain -- --run layout-file`
Expected: FAIL.

- [ ] **Step 3: Implementar parser/serializer e UI**

Importação mostra resumo antes de aplicar; exportação nunca inclui tokens, senha, roomId real ou capacidades.

- [ ] **Step 4: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/domain -- --run && npm test --workspace @camera-grid/web -- --run layout-file`
Expected: PASS.

```bash
git add packages/domain apps/web apps/server
git commit -m "feat: add validated layout portability"
```

### Task 9: Presença, reconexão e placeholders

**Files:**
- Create: `apps/server/src/presence-service.ts`, `apps/server/test/presence-service.test.ts`
- Create: `apps/web/src/composition/DisconnectedPlaceholder.tsx`, `apps/web/test/participant-lifecycle.test.tsx`
- Modify: `apps/server/src/ws-gateway.ts`, `apps/web/src/routes/OutputPage.tsx`

**Interfaces:**
- Produces: `PresenceState = connecting|connected|disconnected|conflict`, timestamps e política de placeholder.

- [ ] **Step 1: Testar lifecycle estável**

Desconectar não desloca ninguém; reconectar restaura slot; stream ID em uso gera `conflict`; frame antigo nunca permanece sem indicador após timeout documentado.

- [ ] **Step 2: Rodar teste para confirmar falha**

Run: `npm test --workspace @camera-grid/server -- --run presence && npm test --workspace @camera-grid/web -- --run participant-lifecycle`
Expected: FAIL.

- [ ] **Step 3: Implementar presença derivada de eventos VDO validados**

Se não houver evento confiável, usar timeout conservador e documentar a limitação; não inventar evento.

- [ ] **Step 4: Rodar testes e commit**

Run: `npm test --workspace @camera-grid/server -- --run && npm test --workspace @camera-grid/web -- --run`
Expected: PASS.

```bash
git add apps/server apps/web docs/vdo-ninja-contract.md
git commit -m "feat: preserve participant layout across reconnects"
```

### Task 10: Hardening, desempenho e diagnóstico

**Files:**
- Create: `apps/web/src/diagnostics/DiagnosticsPanel.tsx`, `apps/web/test/diagnostics.test.tsx`
- Create: `apps/server/src/security.ts`, `apps/server/test/security.test.ts`
- Create: `docs/security.md`, `docs/performance.md`
- Modify: `apps/server/src/app.ts`, `apps/web/src/vdo/*`

**Interfaces:**
- Produces: redaction de logs, CSP/CORS finais, métricas locais não persistentes e perfis `economy|quality`.

- [ ] **Step 1: Testar fronteiras de segurança**

Payload grande, origem inválida, replay de revisão, HTML em nome, token em log e postMessage forjado devem ser rejeitados/redigidos.

- [ ] **Step 2: Testar perfil econômico e preview desligável**

Economy gera parâmetros documentados próximos de 480p/30; painel pode desmontar somente seu preview voluntário sem afetar o receptor OBS.

- [ ] **Step 3: Rodar testes para confirmar falhas**

Run: `npm test --workspace @camera-grid/server -- --run security && npm test --workspace @camera-grid/web -- --run diagnostics`
Expected: FAIL.

- [ ] **Step 4: Implementar hardening e diagnóstico**

Não exibir URLs privadas completas. Explicar que múltiplos receptores aumentam carga e que latência/qualidade dependem da rede.

- [ ] **Step 5: Rodar testes e commit**

Run: `npm run typecheck && npm test && npm run build`
Expected: PASS.

```bash
git add apps docs
git commit -m "feat: harden local production controls"
```

### Task 11: Verificação real com duas e até nove câmeras

**Files:**
- Create: `docs/manual-tests/two-cameras-windows.md`, `nine-cameras-windows.md`, `obs-transparency.md`
- Create: `docs/manual-tests/results/.gitkeep`
- Modify: `docs/performance.md`, `docs/adr/0002-vdo-receiver-strategy.md`

**Interfaces:**
- Consumes: aplicação completa.
- Produces: roteiros reproduzíveis e resultados locais redigidos; resultados reais permanecem fora do Git quando contêm IDs/salas.

- [ ] **Step 1: Executar full suite automatizada**

Run: `npm run typecheck && npm test && npm run build && npm run test:e2e`
Expected: PASS; registrar contagem e duração.

- [ ] **Step 2: Testar manualmente duas webcams reais**

Confirmar vídeo simultâneo, ausência de áudio, identidade estável, layout independente, reconexão, placeholder e carga com preview ligado/desligado.

- [ ] **Step 3: Testar transparência real no OBS Windows**

Fonte de navegador 1920×1080 sobre captura de jogo; sem fundo, UI, scroll, áudio ou pedido de câmera; mover no painel sem reload visual.

- [ ] **Step 4: Executar roteiro progressivo de 3 a 9 câmeras**

Registrar por quantidade: CPU, memória, upload dos convidados, download do dono, frames perdidos e comportamento após queda. Se não houver nove câmeras/pessoas, marcar os níveis não executados `MANUAL PENDING`.

- [ ] **Step 5: Repetir revogação versus ocultação**

Revogado não entra/reentra na produção conforme Gate A; oculto continua conectado e pode ser restaurado. Registrar evidência distinta.

- [ ] **Step 6: Commit somente roteiros e conclusões não sensíveis**

```bash
git add docs
git commit -m "test: document real OBS and multi-camera validation"
```

### Task 12: README, CI, revisão e publicação no GitHub

**Files:**
- Create: `.github/workflows/ci.yml`, `LICENSE`
- Modify: `README.md`, `.gitignore`, todos os docs finais

**Interfaces:**
- Produces: repositório público `rhoneycruz-ui/camera-grid-obs` com CI e instruções completas; nenhum deploy de site.

- [ ] **Step 1: Completar README em português**

Cobrir pré-requisitos, comandos exatos, criação da sala, convites individuais, revogação, câmera, painel, OBS, Discord sem áudio duplicado, layouts, diagnóstico, hospedagem possível, limitações e dependência VDO.Ninja.

- [ ] **Step 2: Adicionar CI**

Executar install com lockfile, typecheck, testes, build e E2E sem webcam. Nomear claramente que CI não comprova WebRTC/OBS real.

- [ ] **Step 3: Auditar privacidade e segredos**

Verificar histórico alcançável e arquivos rastreados para tokens, senhas, room IDs, URLs privadas, e-mail, paths pessoais, mídia, logs e resultados reais. Remover antes do push; nunca reescrever histórico público sem autorização.

- [ ] **Step 4: Rodar verificação final**

Run: `npm ci && npm run typecheck && npm test && npm run build && npm run test:e2e && git diff --check && git status --short`
Expected: todos PASS; worktree limpa após commit.

- [ ] **Step 5: Revisão independente de alto risco**

Revisar especialmente áudio, autorização, revogação, iframe lifecycle, origem postMessage e claims manuais. Corrigir Critical/Important antes de publicar.

- [ ] **Step 6: Criar repositório público e enviar branch**

Criar `rhoneycruz-ui/camera-grid-obs` público, adicionar remote somente após confirmar URL real, push de `main` base e `codex/technical-spike`, abrir PR e aguardar CI verde. Não fazer force push.

- [ ] **Step 7: Integrar e verificar remotamente**

Após revisão e CI verde, merge; conferir README, licença, Actions e ausência de arquivos privados. Publicação da página de convidados permanece separada e exige nova autorização.

```bash
git add .github README.md LICENSE .gitignore docs
git commit -m "docs: prepare Camera Grid OBS for public release"
```

## Manual Windows Gates Summary

O dono deverá executar ou acompanhar estes testes; nenhum deles pode ser substituído por mock:

1. uma webcam real publicando pelo VDO.Ninja sem permissão/trilha de microfone;
2. vídeo real recebido na Fonte de navegador do OBS;
3. fundo transparente sobre captura real de jogo;
4. movimento e resize chegando à saída sem reload da conexão;
5. revogação impedindo aprovação local, ocultação mantendo autorização e tentativa direta ao VDO registrada sem promessa de bloqueio;
6. duas webcams simultâneas antes da expansão;
7. queda/reconexão de rede e identidade estável;
8. teste progressivo até nove câmeras, marcando como pendente tudo que não for realmente executado;
9. Discord capturado separadamente, sem áudio VDO duplicado.

## Stop Conditions

- Gate A não define revogação implementável: parar antes do domínio final.
- VDO.Ninja solicita/publica áudio apesar dos parâmetros e permissões: parar e corrigir contrato.
- OBS exige reload para atualizar layout: parar antes do editor completo.
- Estratégia escolhida excede carga aceitável com duas câmeras: revisar arquitetura antes de nove.
- Evento/API necessária não existe na documentação oficial: registrar limitação, propor ajuste e pedir aprovação.
- Teste manual não executado: manter `MANUAL PENDING`, nunca declarar PASS.
