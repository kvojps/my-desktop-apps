#!/usr/bin/env bash

BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
BASE_PATH=""

print_repo_info() {
  local dir="$1"
  local repo_name
  repo_name="$(basename "$dir")"
  
  echo "📁 Repositório: $repo_name"
  cd "$dir" || return

  local head_commit
  head_commit=$(git log -1 --pretty=format:'%d')
  echo "🔖 Último commit (HEAD): $head_commit"

  echo "🌿 Branches agrupadas por commit:"

  declare -A branches_by_commit
  declare -A commit_info_by_hash
  declare -A commit_timestamp_by_hash

  while read -r branch; do
    local commit_hash commit_info timestamp
    commit_hash=$(git rev-parse "$branch")
    commit_info=$(git log -1 --pretty=format:'%h - %an, %ar' "$branch")
    timestamp=$(git log -1 --pretty=format:'%ct' "$branch")

    branches_by_commit["$commit_hash"]+="$branch "
    commit_info_by_hash["$commit_hash"]="$commit_info"
    commit_timestamp_by_hash["$commit_hash"]="$timestamp"
  done < <(git for-each-ref --format='%(refname:short)' refs/heads/ refs/remotes/)

  for hash in "${!branches_by_commit[@]}"; do
    local sorted_branches
    sorted_branches=$(echo "${branches_by_commit[$hash]}" | tr ' ' '\n' | sort | tr '\n' ' ' | sed 's/ $//')
    printf "%s|%s|%s\n" "${commit_timestamp_by_hash[$hash]}" "${commit_info_by_hash[$hash]}" "$sorted_branches"
  done | sort -nr | while IFS='|' read -r _ info branches; do
    local output=""
    IFS=' ' read -r -a branch_array <<< "$branches"
    for i in "${!branch_array[@]}"; do
      [[ $i -gt 0 ]] && output+="${YELLOW}|${NC} "
      output+="${branch_array[$i]} "
    done
    echo -e "  ${BLUE}${info}${NC} → $output"
  done

  echo
}

export -f print_repo_info

find "$BASE_PATH" -name ".git" | while read -r line; do
  print_repo_info "${line/.git/}"
done
