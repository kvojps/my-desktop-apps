import { useReposContext } from '@/contexts/ReposContext';

export function useRepos() {
  return useReposContext();
}
