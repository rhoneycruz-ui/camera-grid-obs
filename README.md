# Camera Grid OBS

Prova técnica, com segurança como prioridade, para organizar até nove webcams do
VDO.Ninja em uma camada transparente para o OBS Studio. O VDO.Ninja transporta
somente vídeo; a voz permanece no Discord.

## Estado

**Gate A aceito com limitações documentadas; prova técnica em andamento.** O
painel completo não será construído antes dos testes reais. Vídeo real, transparência
no OBS e ausência de áudio só serão aprovados após testes manuais no Windows.

## Modelo de segurança

- nenhum iframe de convidado recebe permissão de microfone;
- publicadores usam `audiodevice=0` e receptores usam `noaudio`;
- nomes de salas, senhas, tokens, dados de clientes, mídia e logs não entram no Git;
- os futuros serviços de estado e controle escutam apenas em `127.0.0.1`;
- ocultar uma câmera nunca equivale a revogar o convite;
- revogar bloqueia aprovação local, mas não promete banimento direto no VDO.Ninja;
- testes simulados não comprovam vídeo real nem funcionamento no OBS.

Consulte o [contrato VDO.Ninja](docs/vdo-ninja-contract.md), a
[ADR de revogação](docs/adr/0001-invite-revocation-boundary.md) e o
[roteiro manual no Windows](docs/manual-tests/technical-spike-windows.md).

## Desenvolvimento

Requer Node.js 22–24 e npm.

```powershell
npm install
npm run typecheck
npm test
npm run build
```

O pacote inicial `@camera-grid/vdo` expõe builders tipados com allowlist; ele não
aceita parâmetros de query livres.

## Verificação de segredos antes de commits

```powershell
git diff --cached
git grep -n -I -E "(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)"
```

Ocorrências em documentação precisam de revisão manual. O repositório nunca deve
conter um segredo real ou uma URL reutilizável de produção.
