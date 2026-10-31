# Camera Grid OBS — Design

## Intento

Construir uma aplicação independente para organizar até nove webcams em uma live de jogos.
Os convidados publicam somente vídeo pelo VDO.Ninja; o dono monta o layout; o OBS recebe uma
página transparente sobre a captura do jogo. Voz continua exclusivamente no Discord.

O projeto será um repositório público independente chamado `camera-grid-obs`. Ele não reutiliza,
importa nem altera código, dados, credenciais ou componentes do Projeto Ville.

## Por que

O dono precisa transformar várias webcams remotas em uma camada visual estável e editável sem
mensalidade obrigatória, sem infraestrutura própria de vídeo e sem misturar os controles de
produção com os links entregues aos convidados ou ao OBS.

## Objetivos

- suportar oito convidados e uma nona câmera opcional;
- publicar e receber somente vídeo, sem solicitar, publicar ou reproduzir microfone;
- permitir composição lógica em 1920 × 1080 com arraste, redimensionamento e edição numérica;
- atualizar a saída do OBS sem recriar conexões de vídeo a cada movimento;
- manter identidade e posição estáveis após desconexão e reconexão;
- persistir layouts e presets localmente, com importação e exportação JSON validada;
- oferecer uma página pública HTTPS simples para convidados;
- separar convite, administração e saída OBS;
- começar por uma prova técnica real antes do painel completo;
- preparar código, documentação, testes e histórico Git profissionais.

## Não objetivos da primeira versão

- transportar voz, substituir Discord ou mixar áudio;
- construir SFU, TURN, sinalização ou outra infraestrutura WebRTC própria;
- gravar vídeos ou armazenar mídia;
- hospedar publicamente o painel administrativo ou o servidor local;
- prometer disponibilidade, latência ou qualidade fixas do VDO.Ninja;
- controlar OBS via obs-websocket;
- acessar ou modificar o DOM interno de iframes de outra origem;
- simular expulsão ou encerramento remoto caso a API oficial não ofereça a ação necessária.

## Antiobjetivos

O projeto será considerado incorreto se solicitar microfone, colocar credencial administrativa na
URL do OBS, depender apenas de `localStorage`/`BroadcastChannel` para sincronizar painel e OBS,
recriar iframes durante movimentos, embaralhar posições após reconexão ou afirmar que testes reais
de OBS/WebRTC passaram sem terem sido executados.

## Restrições

- React, TypeScript e Vite no frontend;
- Node.js/TypeScript no servidor local;
- VDO.Ninja é a infraestrutura externa de vídeo;
- servidor local escuta em loopback por padrão;
- convidados precisam de página pública HTTPS, mas não de acesso ao computador do dono;
- saída OBS e painel rodam no computador do dono;
- coordenadas canônicas permanecem em 1920 × 1080;
- nenhum segredo, senha de sala ou dado real entra no Git;
- parâmetros e eventos VDO.Ninja só podem ser usados após confirmação na documentação oficial e
  registro da fonte em `docs/vdo-ninja-contract.md`.

## Abordagens consideradas

### 1. Mixer nativo do VDO.Ninja

Usar uma cena VDO.Ninja como composição completa e controlar seu layout pela API de iframe.

Vantagens: menos código de recepção, integração direta com o mixer e menor risco de administrar
vários receptores. Desvantagens: liberdade insuficiente ou incerta para molduras, placeholders,
nomes, bloqueios e regras visuais individuais exigidas pelo produto.

### 2. Um receptor independente por câmera

Criar um iframe `view` por stream e posicionar seus contêineres na saída.

Vantagens: controle visual completo fora do iframe. Desvantagens: mais conexões, CPU e banda;
maior risco de duplicar recepções entre painel e OBS; presença e direção da sala ficam mais difíceis.

### 3. Arquitetura híbrida — escolhida

Usar o diretor e as cenas do VDO.Ninja para presença, identidade de stream e ciclo de vídeo, mas
manter layout, decoração e persistência na aplicação. A prova técnica decidirá entre uma cena
única controlada por layout oficial e receptores individuais mantidos estáveis. A decisão final
será baseada em evidência de funcionamento, consumo e suporte aos requisitos visuais, sem alterar
o contrato externo do restante da aplicação.

Essa abordagem preserva um caminho de menor custo com o mixer nativo e mantém uma alternativa
documentada caso ele não ofereça o controle visual necessário.

## Arquitetura

```text
Convidado HTTPS                         Computador do dono
┌─────────────────────┐                 ┌──────────────────────────────┐
│ Guest Web           │                 │ Control Web                  │
│ VDO.Ninja publisher │── vídeo P2P ───▶│ VDO director/preview        │
│ audio disabled      │                 │ layout editor 1920×1080     │
└─────────────────────┘                 └──────────────┬───────────────┘
                                                     │ WebSocket loopback
                                      ┌──────────────▼───────────────┐
                                      │ Local Control Server         │
                                      │ session + layout + journal   │
                                      └──────────────┬───────────────┘
                                                     │ WebSocket loopback
                                      ┌──────────────▼───────────────┐
                                      │ OBS Output Web               │
                                      │ transparent 1920×1080        │
                                      │ stable VDO receivers         │
                                      └──────────────────────────────┘
```

### Pacotes

- `apps/web`: React/Vite com rotas de convidado, painel e saída;
- `apps/server`: HTTP/WebSocket local, persistência atômica e autorização por capacidade;
- `packages/domain`: schemas, coordenadas, identidade, comandos e redução de estado;
- `packages/vdo`: geração de URLs e adapter de iframe/postMessage com allowlist;
- `packages/ui`: componentes compartilhados sem regras de segurança;
- `docs`: contratos VDO.Ninja, configuração OBS, testes manuais e limitações.

Um monorepo npm workspaces mantém tipos e validações compartilhados sem duplicação. O lockfile é
versionado.

## Prova técnica obrigatória

Antes do painel completo, implementar um vertical slice descartável apenas se necessário, depois
transformá-lo em código testado:

1. gerar uma identidade criptográfica de sessão e de participante;
2. abrir uma página de convidado com câmera e `audiodevice=0`;
3. publicar uma webcam real para o VDO.Ninja;
4. receber o vídeo numa página de saída compatível com Fonte de navegador do OBS;
5. mover e redimensionar a caixa pelo painel via WebSocket sem substituir o iframe;
6. confirmar por permissões e trilhas WebRTC que nenhuma faixa de áudio foi solicitada/publicada;
7. confirmar transparência visual sobre uma captura de jogo;
8. medir conexões, CPU e banda com painel aberto e fechado.

Se OBS ou webcam não estiverem disponíveis, os passos dependentes permanecem explicitamente
`MANUAL PENDING`; mocks não os aprovam.

## Contrato VDO.Ninja inicialmente confirmado

- publicação usa `push` com stream ID explícito e estável;
- `audiodevice=0` desativa a fonte de áudio na publicação;
- recepção/scene usa `noaudio` e a aplicação também mantém elementos de mídia mutados;
- `cleanoutput` remove interface não desejada;
- qualidade econômica usa parâmetros documentados de captura e bitrate;
- diretor por iframe oferece comandos de cena, lista de convidados e layout;
- mensagens recebidas são aceitas somente da origem VDO configurada e da janela do iframe;
- mensagens enviadas usam `targetOrigin` explícito, nunca `*` no adapter de produção.

O contrato completo, versões observadas, exemplos e limitações serão congelados em documentação e
testes de URL antes da integração.

## Sessão, links e autorização

O servidor local cria:

- `roomId`: identificador público aleatório da sala VDO;
- `adminCapability`: segredo somente do painel, guardado localmente e fora das URLs públicas;
- `outputCapability`: capacidade somente leitura para conectar a saída local;
- `inviteToken`: capacidade pública individual, revogável e vinculada a um slot/participante;
- `participantId` e `streamId`: identificadores criptográficos estáveis, independentes do nome.

O dono gera até nove links individuais, um por amigo/slot. O link público de convite contém
somente a capacidade limitada necessária à entrada e pode ser reutilizado em outro navegador ou
dispositivo sem perder a posição. Um convite perdido pode ser revogado e regenerado sem alterar o
slot; o token anterior deixa de ser aceito pela aplicação. Toda entrada ou reconexão na produção
exige aprovação local explícita com diretor online. Isso não constitui banimento no VDO.Ninja:
quem já possui dados válidos do destino pode tentar acesso direto fora do controle da aplicação.
O link OBS
não contém senha de diretor nem capacidade administrativa. Mutações de layout exigem conexão
loopback e capacidade administrativa. A saída apenas assina o estado e não envia comandos.

Como convidados não acessam localhost, a identidade estável é derivada da capacidade individual e
não depende apenas de `localStorage`. A página pública publica diretamente no VDO.Ninja. O vínculo
`participantId → streamId → slot` já existe antes da primeira conexão e é confirmado pelo servidor
local quando o diretor observa o stream. Reconexões e troca de dispositivo reutilizam o mesmo
slot e stream ID enquanto o convite continuar válido.

### Senhas e capacidades

A senha opcional de entrada protege a sala pelo mecanismo oficialmente suportado pelo VDO.Ninja e
é distinta da autorização administrativa. O painel local usa uma capacidade gerada pelo servidor,
armazenada somente no computador do dono. A saída OBS recebe apenas capacidade local de leitura.
A página estática não implementa uma falsa validação de senha no cliente nem trata ocultação de UI
como autorização.

Há três controles independentes: autorização para publicar, capacidade para visualizar a saída e
visibilidade da caixa no layout. Revogar convite bloqueia aprovação local de publicação e solicita
desconexão, mas não revoga automaticamente uma capacidade de visualização; ocultar só altera o
layout. Se o diretor ou servidor local estiver offline, novas aprovações ficam fechadas por padrão.

## Estado e persistência

O estado canônico contém versão de schema, revisão monotônica, sessão, participantes e layout.
Cada câmera possui:

- `participantId`, `streamId`, nome sanitizado e status de conexão;
- `x`, `y`, `width`, `height` em coordenadas 1920 × 1080;
- `zIndex`, visibilidade, bloqueio e manutenção de proporção;
- exibição do nome, borda, cor, raio, espelhamento e modo `cover`/`contain`;
- política desconectada: ocultar ou placeholder.

Comandos carregam `expectedRevision`. O servidor rejeita estado obsoleto. Movimentos são enviados
em tempo real à saída, mas persistidos com debounce e obrigatoriamente ao finalizar o gesto. Escrita
em disco usa arquivo temporário + rename atômico. Presets e layouts importados passam por schema
Zod, limites numéricos e normalização antes de substituir o estado.

## Sincronização

O painel envia comandos de domínio pelo WebSocket. O servidor valida autorização, schema e revisão,
reduz o estado e transmite snapshots/deltas à saída. O React mantém os componentes de vídeo
montados com chaves baseadas em `participantId`; mudanças geométricas alteram somente CSS.

Reconexão WebSocket solicita snapshot completo. Reconexão VDO reaproveita o `streamId` estável.
Desconectar uma câmera muda somente seu status e não reordena as demais.

## Interface do convidado

- aviso explícito de que a imagem pode aparecer em live pública;
- nome sanitizado e identidade persistente local;
- seleção de webcam, prévia e botão explícito para iniciar;
- iframe VDO com `allow="camera; autoplay; fullscreen"`, sem permissão de microfone;
- parâmetros VDO que desativam áudio na origem;
- estados claros para câmera negada, câmera ocupada, desconexão e stream ID em uso;
- controles para desligar câmera e sair;
- nenhum vídeo dos demais participantes é recebido.

## Painel do dono

- interface escura em português;
- canvas responsivo representando 1920 × 1080;
- `react-rnd` ou alternativa mantida, confirmada antes da instalação;
- arraste, resize por bordas/cantos, proporção, campos X/Y/W/H e bloqueio;
- frente/trás, mostrar/ocultar, nome, borda, cor, raio, espelho e cover/contain;
- preset inicial com quatro câmeras em cada lateral e centro livre;
- nona câmera livre;
- guias e snap entram somente após os controles essenciais;
- preview econômico, pausável e opcional;
- status de conexão e opção de placeholder;
- salvar preset, exportar e importar JSON.

## Saída OBS

- rota local somente leitura em 1920 × 1080;
- HTML, body, root e canvas com fundo transparente;
- sem menus, edição, scrollbars ou indicadores administrativos;
- elementos de mídia permanentemente mutados e sem captura local;
- caixas atualizadas por CSS sem remontar iframe;
- último layout válido carregado no startup;
- reconexão WebSocket e estado visível de desconexão;
- URL configurada como Fonte de navegador do OBS com largura 1920 e altura 1080.

## Segurança e privacidade

- `crypto.getRandomValues`/`randomBytes` para identificadores e capacidades;
- schemas Zod em todas as fronteiras;
- CSP e allowlists de origem;
- validação de `event.origin`, `event.source` e shape em `postMessage`;
- servidor em `127.0.0.1`, CORS restrito e mutações autenticadas;
- nomes renderizados como texto, nunca HTML;
- segredos e URLs privadas mascarados em logs;
- nenhuma senha, token, sala real, gravação ou layout pessoal versionado;
- sessão encerrada revoga capacidades locais e interrompe receptores, mas só declara encerramento
  remoto se a API VDO.Ninja comprovar a ação.

## Desempenho

- padrão econômico próximo de 480p/30, ajustado apenas a parâmetros oficialmente suportados;
- perfil maior opcional;
- bitrate solicitado pelo receptor e limite máximo no publicador quando documentado;
- nenhuma malha de vídeo entre convidados;
- preview do painel em baixa qualidade ou desligado;
- iframes estáveis e atualizações geométricas via CSS;
- persistência fora do loop de cada pixel;
- documentação explica que painel + OBS podem criar múltiplos receptores e aumentar upload;
- teste incremental com uma, duas e depois até nove câmeras.

## Testes automatizados

- conversão preview ↔ 1920 × 1080;
- clamps e proporção;
- reducer de layout, z-order e locks;
- persistência/restauração e migração de schema;
- identidade estável e reconexão sem reordenação;
- importação JSON válida e inválida;
- autorização: convidado e saída não alteram layout;
- sincronização WebSocket entre dois contextos separados;
- URLs VDO.Ninja sem áudio e com parâmetros allowlisted;
- validação de origem/janela no adapter postMessage;
- componentes de vídeo não remontam durante movimento;
- transparência estrutural e ausência de controles na rota OBS.

## Verificação manual

- uma câmera real na prova técnica;
- duas câmeras reais antes da expansão;
- OBS com transparência sobre captura de jogo;
- inspeção de permissões confirmando ausência de microfone;
- queda e retorno de rede;
- câmera negada e ocupada;
- teste progressivo até nove câmeras;
- medição de CPU, memória, banda e estabilidade;
- Discord e áudio do OBS verificados separadamente.

## Distribuição e hospedagem

O painel e a saída são servidos pelo servidor local. A página de convidado será um build estático
compatível com hospedagem HTTPS gratuita. O código vai ao GitHub; publicar o site será uma ação
posterior e separada, com autorização explícita. O README distinguirá claramente dependências
locais, serviço externo VDO.Ninja e limitações dos serviços gratuitos.

A primeira versão exige Node.js e usa comandos `npm` documentados para instalação e execução. Um
executável ou instalador Windows é uma evolução posterior, fora do escopo de v1, depois que o fluxo
WebRTC/OBS estiver validado.

## Sequência de entrega

1. contrato documentado do VDO.Ninja e modelos de domínio;
2. servidor local mínimo e sincronização painel → saída;
3. prova técnica de uma câmera sem áudio;
4. decisão registrada sobre cena única versus receptores individuais;
5. editor completo, persistência e presets;
6. página pública de convidado e tratamento de erros;
7. testes de duas câmeras e roteiro de nove;
8. documentação OBS, segurança, diagnóstico e desempenho;
9. revisão, CI, commits organizados e publicação no GitHub público.

## Decisões deixadas ao implementador

- biblioteca exata de drag/resize após checagem de manutenção e compatibilidade React;
- formato interno de mensagens WebSocket, desde que versionado e validado;
- biblioteca de servidor HTTP/WebSocket e de testes;
- hospedagem estática gratuita a recomendar, sem publicar automaticamente;
- valores econômicos finais de bitrate/resolução após a prova técnica e confirmação documental.

## Riscos conhecidos

- VDO.Ninja é serviço externo e pode mudar, ficar indisponível ou variar conforme rede/NAT;
- múltiplos receptores elevam upload do convidado, CPU e banda do dono;
- APIs de iframe podem ter comportamento diferente entre navegador comum e Chromium do OBS;
- um site público incorporando VDO.Ninja pode exigir permissão de câmera em mais de uma origem;
- qualidade e latência não são garantidas;
- testes completos dependem de webcams, OBS e participantes reais.
