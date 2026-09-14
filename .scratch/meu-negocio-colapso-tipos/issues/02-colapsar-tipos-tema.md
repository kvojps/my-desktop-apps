Status: done (QA manual pendente — ver checklist)

# Colapsar tipos de Modo de tema

Blocked by: nada

## O que fazer

Colapsar o tipo `ThemeModeEntity` (`apps/meu-negocio-app/src/main/domain/theme.ts`)
no tipo equivalente `ThemeMode`
(`apps/meu-negocio-app/src/shared/types/theme.ts`) — hoje um alias puro de
`'light' | 'dark'` dos dois lados, confirmado por leitura direta.

Diferente de Produto: `domain/theme.ts` não é apagado. Ele guarda
`THEME_MODE_KEY` e duas funções de domínio real (`isThemeModeEntity`,
`resolveThemeMode`, usada pelo carve-out de bootstrap de `main/index.ts`
antes de existir camada IPC — ADR-0002) — mesmo papel de `domain/settings.ts`
no `git-dlog`. Só o alias de tipo, puramente duplicado, colapsa.

`ThemeModeEntity` também aparece em `main/infra/gateways/system/themeMode.ts`,
`main/services/settingsService.ts` e `main/index.ts` — todos precisam trocar
o import para `ThemeMode` de `@shared/types/theme`.
`main/controllers/settingsController.ts` já usa `ThemeMode` de
`@shared/types/theme` diretamente hoje (o retorno cruza por atribuição, sem
mapper — `ThemeMode` é união de literais); conferir na execução que nada
mais precisa mudar ali.

## Checklist

- [x] Em `main/domain/theme.ts`: remover `type ThemeModeEntity = 'light' |
      'dark'`; `isThemeModeEntity`/`resolveThemeMode` passam a usar
      `ThemeMode` de `@shared/types/theme` como parâmetro/retorno.
- [x] Avaliar renomear `isThemeModeEntity` → `isThemeMode` (o tipo que a
      função testa deixou de ter sufixo `Entity`), citando o precedente do
      `git-dlog` (`isThemeMode`, sem sufixo, no mesmo papel). Se renomeado,
      atualizar `main/index.ts` (único outro importador). Renomeado;
      `main/index.ts` não importava a função diretamente, então nada mudou
      ali além do tipo.
- [x] `main/infra/gateways/system/themeMode.ts`: `ThemeModeGateway`,
      `ThemeModeSystemGateway`, `BACKGROUND`, `apply`, `currentMode`,
      `windowBackgroundFor` trocam `ThemeModeEntity` por `ThemeMode`.
- [x] `main/services/settingsService.ts`: `getThemeMode`/`saveThemeMode`
      trocam `ThemeModeEntity` por `ThemeMode`.
- [x] `main/index.ts`: `createWindow(mode: ThemeModeEntity)` e o import
      trocam para `ThemeMode` de `@shared/types/theme`; `THEME_MODE_KEY` e
      `resolveThemeMode` continuam importados de `./domain/theme`.
- [x] Confirmar que `main/controllers/settingsController.ts` não precisa de
      nenhuma mudança (já importa `ThemeMode` de `@shared/types/theme`).
      Confirmado, arquivo intocado.
- [x] `npm run typecheck`.
- [x] `npm run lint`.
- [x] `npm test`.
- [ ] QA manual (`npm run dev:negocio`): alternar tema claro/escuro na tela
      de Configurações e reabrir o app confirmando que a preferência
      persiste. **Pendente** — sandbox sem driver de UI Electron.
