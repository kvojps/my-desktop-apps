# StatusChip proíbe warning como outlined

`#fab219` (o token `warning` do design system) dá 1.70:1 de contraste como
texto sobre papel claro — falha AA por uma margem grande (docs/design-system.md
§1.4). Antes desta decisão, quatro call sites diferentes no git-dlog
reproduziram esse erro de forma independente (`HEAD detached`, ahead/behind
em `SyncChips`, `review_required` em `ReviewChip`), todos usando
`Chip color="warning" variant="outlined"` — um combo que o MUI aceita sem
aviso porque o limiar automático dele é 3:1, não 4.5:1 (§1.3).

Decidimos que o componente `StatusChip` proíbe essa combinação na raiz:
`tone="warning"` sempre renderiza `filled` + ícone + `contrastText` preto,
independente do que o call site pedir, em vez de corrigir cada uso
manualmente. A alternativa (revisar cada chip individualmente) deixaria a
regra implícita e sujeita a voltar no próximo call site novo — quatro
ocorrências independentes já mostraram que isso acontece na prática.
