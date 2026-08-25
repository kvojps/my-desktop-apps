Status: resolvido
Blocked by: 04

# git-dlog: entidades de persistência

`domain/scanPath.ts` e `domain/settings.ts`. Tipos anêmicos, sufixo `Entity`, sem classes.

Hoje `rowToScanPath` (`db/scanPathsRepository.ts:13`) converte a linha do banco direto para
`ScanPath` de `@shared/types/scanPath` — ou seja, o repositório devolve o próprio tipo do fio.
Passa a devolver `ScanPathEntity`; quem converte para o tipo de `@shared` é o controller
(ticket 09).

```
ScanPathRow (snake_case)  --rowToScanPath-->  ScanPathEntity  --toResponse-->  ScanPath (@shared)
     infra/database/repositories/                  domain/            controllers/
```

`settingsRepository` é key-value e não tem entidade rica a modelar; `domain/settings.ts`
carrega os tipos do que está guardado (modo de tema, token cifrado em base64).

## Nome

O sufixo `Entity` é obrigatório e existe para resolver a colisão: `ScanPath` (contrato, em
`@shared`) e `ScanPathEntity` (domínio, em `main/domain`) aparecem no mesmo arquivo no mapper
do controller. Alias de import foi descartado — as duas formas são estruturalmente idênticas,
então o TypeScript não pega a troca.

## Comments

`domain/scanPath.ts` e `domain/settings.ts` criados; `scanPathsRepository` devolve
`ScanPathEntity` e `settingsRepository` fala `ThemeModeEntity`. O `rowToScanPath` manteve o
nome — o que mudou foi o tipo de retorno.

`domain/settings.ts` levou uma função pura junto dos tipos: `isThemeModeEntity`, que era o
`stored === 'light' || stored === 'dark'` inline no repositório. "O que conta como modo de
tema guardado" é vocabulário, não SQL.

Duas coisas ficaram de fora de propósito:

- **`EncryptedGithubTokenEntity` é `string` pelado.** Documenta a diferença entre o token
  digitado e o que está no banco, mas o TypeScript não pega a troca de um pelo outro — é a
  mesma colisão estrutural que o sufixo `Entity` resolve para `ScanPath`, e aqui ela segue
  aberta. Um tipo *branded* fecharia; custa um `as` no repositório e outro no gateway. Vale
  reavaliar no ticket 08, quando a cifragem sair para `infra/gateways/system/` e o tipo
  ganhar os dois call sites de verdade.
- **A entidade ainda atravessa o IPC sem mapper**, e não só nos três canais de `scanPaths`:
  o `settings:saveThemeMode` também recebe o `ThemeMode` do zod e entrega direto num
  parâmetro `ThemeModeEntity`. Todos typecheam pela identidade estrutural — que é a mesma
  troca silenciosa que o sufixo `Entity` existe para o TypeScript pegar. Um comentário em
  `controllers/registerIpc.ts` marca o ponto até o ticket 09.

  `index.ts` faz a mesma travessia (`resolveInitialThemeMode` declara `ThemeMode` sobre o
  que o repositório devolve como `ThemeModeEntity`) e fica como está: é o carve-out de
  bootstrap do ADR-0002, e não tem controller a atravessar.
