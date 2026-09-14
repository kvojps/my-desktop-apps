Status: todo

# 05: Colapsar `ThemeModeEntity` (theme.ts continua existindo)

Blocked by: nada

## O que fazer

Colapsar só o tipo `ThemeModeEntity` de
`apps/meu-movel-planejado/src/main/domain/theme.ts` no tipo equivalente
`ThemeMode` de `apps/meu-movel-planejado/src/shared/types/theme.ts` —
idênticos hoje. Mesmo padrão já aplicado no `git-dlog` e no
`meu-negocio-app`: `domain/theme.ts` **não é apagado** — continua existindo
para as funções `isThemeModeEntity`/`resolveThemeMode` (lógica real de
domínio, usada no bootstrap do main antes de existir camada IPC).

## Checklist

- [ ] Em `domain/theme.ts`: removido `export type ThemeModeEntity = 'light'
      | 'dark'`.
- [ ] `isThemeModeEntity` renomeada para `isThemeMode` (o sufixo `Entity`
      deixa de fazer sentido: ela passa a guardar o tipo shared, não mais
      um tipo de domínio). `resolveThemeMode` mantém o nome. As duas
      passam a usar `ThemeMode` importado de `@shared/types/theme`.
- [ ] `infra/database/repositories/settingsRepository.ts`: confirmar se usa
      `ThemeModeEntity` (a tabela é chave-valor genérica, `get`/`set`
      trabalham com `string` — se não houver uso direto do tipo, nenhuma
      mudança aqui).
- [ ] `infra/gateways/system/themeMode.ts`: `Record<ThemeModeEntity,
      string>` e as assinaturas de `ThemeModeGateway`/
      `ThemeModeSystemGateway` (`apply`, `currentMode`,
      `windowBackgroundFor`) trocam `ThemeModeEntity` por `ThemeMode`.
- [ ] `services/settingsService.ts`: import de `ThemeModeEntity` trocado
      por `ThemeMode`; `setThemeMode` ajustado.
- [ ] `main/index.ts`: `createWindow(mode: ThemeModeEntity)` e o import de
      `domain/theme.ts` trocam para `ThemeMode` (uso no bootstrap antes da
      camada IPC — `resolveThemeMode` continua sendo chamada de lá).
- [ ] `npm run typecheck` — limpo, sem erros.
- [ ] `npm run lint` — sem erros novos.
- [ ] `npm test` — suíte de lógica pura, sem regressão.
- [ ] QA manual (`npm run dev:movel`): alternar entre tema claro/escuro,
      reiniciar o app e confirmar que a preferência persiste, e que a
      moldura nativa acompanha a troca. **Pendente até execução** —
      sandbox sem driver de UI Electron.
