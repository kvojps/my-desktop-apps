/** Carregamento no formato da lista real, para os dados não empurrarem o layout. */
export function RepoListSkeleton() {
  return (
    <div aria-hidden className="orca:divide-y orca:divide-border">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="orca:space-y-2 orca:px-3 orca:py-2.5">
          <div className="orca:flex orca:items-center orca:gap-2">
            <div className="orca-skeleton orca:h-4 orca:w-14 orca:rounded-md" />
            <div className="orca-skeleton orca:h-4 orca:w-32 orca:rounded-md" />
          </div>
          <div className="orca-skeleton orca:h-3 orca:w-48 orca:rounded-md" />
        </div>
      ))}
    </div>
  );
}
