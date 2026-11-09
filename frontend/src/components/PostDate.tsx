const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatUtcDate(value: string) {
  return dateFormatter.format(new Date(`${value}Z`));
}

export default function PostDate({
  createdAtUtc,
  updatedAtUtc,
}: {
  createdAtUtc: string;
  updatedAtUtc: string | null;
}) {
  const createdDate = formatUtcDate(createdAtUtc);
  const editedDate = updatedAtUtc ? formatUtcDate(updatedAtUtc) : null;

  return (
    <div className="ml-auto text-sm text-neutral-content">
      {editedDate ? (
        <div
          className="tooltip tooltip-top tooltip-end tooltip-primary focus-within:tooltip-open"
          data-tip={`Edited ${editedDate}`}
        >
          <button
            type="button"
            aria-label={`Created ${createdDate}. Edited ${editedDate}`}
            onClick={(event) => event.currentTarget.focus()}
            className="cursor-pointer rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <time dateTime={createdAtUtc}>{createdDate}</time>
            <sup aria-hidden="true" className="ml-0.5 font-bold">
              *
            </sup>
          </button>
        </div>
      ) : (
        <time dateTime={createdAtUtc}>{createdDate}</time>
      )}
    </div>
  );
}
