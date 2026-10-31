# Camera Grid OBS

Prova técnica, com segurança como prioridade, para organizar até nove webcams do
VDO.Ninja em uma camada transparente para o OBS Studio. O VDO.Ninja transporta
somente vídeo; a voz permanece no Discord.

## Estado

**Checkpoint automatizado concluído; Gate B manual pendente.** O corte atual
inclui servidor local, sincronização WebSocket, painel mínimo, guest harness e
duas estratégias de saída transparente (`individual` e `scene`). São 63 testes
automatizados, mas eles não comprovam câmera física, WebRTC real ou OBS.

O painel completo não será construído antes dos testes reais. O adaptador de
admissão/revogação via diretor VDO também permanece bloqueado até que seus
limites sejam comprovados e aprovados.

## Modelo de segurança

- nenhum iframe de convidado recebe permissão de microfone;
- publicadores usam `audiodevice=0` e receptores usam `noaudio`;
- nomes de salas, senhas, tokens, dados de clientes, mídia e logs não entram no Git;
- os serviços de estado e controle escutam apenas em `127.0.0.1` e exigem
  capacidades separadas para painel e saída;
- estado revogado é persistido atomicamente e recuperação corrompida falha
  fechada, sem recriar convite ativo;
- saída revogada fecha clientes e desmonta os receptores VDO;
- ocultar uma câmera nunca equivale a revogar o convite;
- revogar bloqueia aprovação local, mas não promete banimento direto no VDO.Ninja;
- testes simulados não comprovam vídeo real nem funcionamento no OBS.

Consulte o [contrato VDO.Ninja](docs/vdo-ninja-contract.md), a
[ADR de revogação](docs/adr/0001-invite-revocation-boundary.md) e o
[roteiro manual no Windows](docs/manual-tests/technical-spike-windows.md). Os
[resultados automatizados](docs/manual-tests/results/2026-10-31-automated-spike.md)
separam explicitamente o que foi comprovado do que continua `NOT RUN`.

## Desenvolvimento

Requer Node.js 22–24 e npm.

```powershell
npm install
npm run typecheck
npm test
npm run build
```

Para executar a prova local com valores descartáveis e sem versionar salas ou
capacidades, siga o roteiro manual. Ele mostra as rotas `/control`, `/guest` e
`/output`, além da comparação entre `receiver=individual` e `receiver=scene`.

O guest atual é deliberadamente um harness VDO direto. Ele não deve ser tratado
como fronteira de autorização local e informa essa limitação na própria tela.

## Verificação de segredos antes de commits

```powershell
git diff --cached
git grep -n -I -E "(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)"
```

Ocorrências em documentação precisam de revisão manual. O repositório nunca deve
conter um segredo real ou uma URL reutilizável de produção.
