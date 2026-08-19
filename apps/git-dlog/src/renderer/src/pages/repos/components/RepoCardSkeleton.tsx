import { Card, CardContent, Skeleton, Stack } from '@mui/material';

/**
 * Carregamento no formato e tamanho do `RepoCard` real, para não empurrar o
 * layout quando os dados chegam (docs/design-system.md §5.3).
 */
function OneCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="text" width={160} height={28} />
            <Skeleton variant="rounded" width={90} height={24} />
            <Skeleton variant="rounded" width={70} height={24} />
          </Stack>
          <Skeleton variant="text" width={220} />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="rounded" width={120} height={24} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function RepoCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }, (_, index) => (
        <OneCardSkeleton key={index} />
      ))}
    </Stack>
  );
}
