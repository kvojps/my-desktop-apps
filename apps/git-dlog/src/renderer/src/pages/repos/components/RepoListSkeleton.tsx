/** Carregamento no formato da lista real, para os dados não empurrarem o layout. */
export function RepoListSkeleton() {
  return (
    <div aria-hidden className="ui:divide-y ui:divide-border">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="ui:space-y-2 ui:px-3 ui:py-2.5">
          <div className="ui:flex ui:items-center ui:gap-2">
            <div className="ui-skeleton ui:h-4 ui:w-14 ui:rounded-md" />
            <div className="ui-skeleton ui:h-4 ui:w-32 ui:rounded-md" />
          </div>
          <div className="ui-skeleton ui:h-3 ui:w-48 ui:rounded-md" />
        </div>
      ))}
    </div>
  );
}
