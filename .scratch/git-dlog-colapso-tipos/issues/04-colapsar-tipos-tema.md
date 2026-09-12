Status: done (QA manual pendente)

# Colapsar `ThemeModeEntity` (settings.ts continua existindo)

Blocked by: 03-colapsar-tipos-diretorio-base.md (move a explicação do
sufixo `Entity` para `domain/settings.ts` antes desta issue tocar o mesmo
arquivo)

## O que fazer

Colapsar só o tipo `ThemeModeEntity` de
`apps/git-dlog/src/main/domain/settings.ts` no tipo equivalente `ThemeMode`
de `apps/git-dlog/src/shared/types/theme.ts` — idênticos hoje. **Diferente
das issues 01-03**: `domain/settings.ts` não é apagado — continua existindo
para `EncryptedGithubTokenEntity` (sem par shared, nunca cruza IPC) e para
as funções `isThemeModeEntity`/`resolveThemeMode` (lógica real de domínio,
usada no bootstrap do main antes de existir camada IPC).

Eliminar também a terceira cópia local de `ThemeMode` no renderer
(`renderer/src/theme/themeModeContext.ts`), que hoje declara o próprio tipo
em vez de importar do shared.

## Checklist

- [x] Em `domain/settings.ts`: removido `export type ThemeModeEntity = 'light' | 'dark'`.
- [x] `resolveThemeMode` passa a usar `ThemeMode` importado de
      `@shared/types/theme`. A função `isThemeModeEntity` foi renomeada
      para `isThemeMode` (o sufixo `Entity` deixou de fazer sentido: ela
      guarda o tipo shared, não mais um tipo de domínio).
- [x] `EncryptedGithubTokenEntity` e seu comentário continuam intocados.
- [x] `infra/database/repositories/settingsRepository.ts`: trocado
      `ThemeModeEntity` por `ThemeMode` de `@shared/types/theme`.
- [x] `infra/gateways/system/theme.ts`: mesma troca.
- [x] `services/settingsService.ts`: mesma troca.
- [x] `main/index.ts`: mesma troca (uso no bootstrap antes da camada IPC).
- [x] `controllers/systemController.ts`: comentário que descrevia
      `ThemeMode`/`ThemeModeEntity` como "a mesma união de literais"
      atualizado — agora é literalmente o mesmo tipo, não duas uniões
      idênticas.
- [x] `renderer/src/theme/themeModeContext.ts`: removida a declaração local
      `export type ThemeMode = 'light' | 'dark'`; agora importa `ThemeMode`
      de `@shared/types/theme` e re-exporta — `ThemeModeProvider.tsx` e
      `theme/index.ts` não precisaram mudar de onde importam.
- [x] `npm run typecheck` — limpo, sem erros.
- [x] `npm run lint` — 0 erros.
- [x] `npm test` — 238 testes, todos passando.
- [ ] QA manual (`npm run dev:dlog`): alternar entre tema claro/escuro,
      reiniciar o app e confirmar que a preferência persiste. **Pendente**
      — sandbox sem driver de UI Electron.
