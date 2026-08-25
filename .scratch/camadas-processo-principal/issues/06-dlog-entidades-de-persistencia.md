Status: aberto
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
