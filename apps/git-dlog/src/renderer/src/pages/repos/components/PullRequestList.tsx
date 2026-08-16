import {
  CancelOutlined,
  CheckCircleOutline,
  HourglassEmpty,
  OpenInNew,
  RateReviewOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { Box, Chip, Link, Stack, Tooltip, Typography } from '@mui/material';
import type { ChecksState, PullRequest, ReviewDecision } from '@shared/types/pullRequest';
import { formatRelativeDate } from '@/utils/format';
import { needsAction, openExternal } from '@/utils/pullRequest';

function ChecksChip({ checks }: { checks: ChecksState }) {
  if (!checks) return null;

  const config = {
    passing: { color: 'success' as const, icon: <CheckCircleOutline />, label: 'CI ok' },
    failing: { color: 'error' as const, icon: <CancelOutlined />, label: 'CI falhou' },
    pending: { color: 'default' as const, icon: <HourglassEmpty />, label: 'CI rodando' },
  }[checks];

  return (
    <Chip
      size="small"
      variant="outlined"
      color={config.color}
      icon={config.icon}
      label={config.label}
    />
  );
}

function ReviewChip({ decision }: { decision: ReviewDecision }) {
  if (!decision) return null;

  const config = {
    approved: { color: 'success' as const, icon: <TaskAltOutlined />, label: 'aprovado' },
    changes_requested: {
      color: 'error' as const,
      icon: <RateReviewOutlined />,
      label: 'mudanças pedidas',
    },
    review_required: {
      color: 'warning' as const,
      icon: <RateReviewOutlined />,
      label: 'aguardando revisão',
    },
  }[decision];

  return (
    <Chip
      size="small"
      variant="outlined"
      color={config.color}
      icon={config.icon}
      label={config.label}
    />
  );
}

export function PullRequestRow({
  pr,
  highlighted = false,
}: {
  pr: PullRequest;
  highlighted?: boolean;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      sx={{
        rowGap: 0.5,
        px: highlighted ? 1 : 0,
        py: highlighted ? 0.75 : 0,
        borderRadius: 1,
        bgcolor: highlighted ? 'action.hover' : 'transparent',
      }}
    >
      <Link
        component="button"
        variant="body2"
        underline="hover"
        onClick={() => openExternal(pr.url)}
        sx={{ fontWeight: needsAction(pr) ? 700 : 500, textAlign: 'left' }}
      >
        #{pr.number} {pr.title}
        <OpenInNew sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} />
      </Link>

      {pr.isDraft && <Chip size="small" variant="outlined" label="rascunho" />}
      <ReviewChip decision={pr.reviewDecision} />
      <ChecksChip checks={pr.checks} />

      <Box sx={{ flex: 1 }} />

      <Tooltip title={`${pr.headBranch} → ${pr.baseBranch}`}>
        <Typography variant="caption" color="text.secondary" fontFamily="mono">
          {pr.headBranch}
        </Typography>
      </Tooltip>
      {pr.updatedAt && (
        <Typography variant="caption" color="text.secondary">
          {formatRelativeDate(pr.updatedAt)}
        </Typography>
      )}
    </Stack>
  );
}
