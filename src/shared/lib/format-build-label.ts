export function formatBuildLabel(buildId: string | undefined): string | null {
  const match = buildId?.match(/^([a-f0-9]{12})-(\d{8})T(\d{6})Z$/i);
  if (!match) return null;

  const commit = match[1];
  const date = match[2];
  const time = match[3];
  if (!commit || !date || !time) return null;

  const builtAt = new Date(
    Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(4, 6)) - 1,
      Number(date.slice(6, 8)),
      Number(time.slice(0, 2)),
      Number(time.slice(2, 4)),
      Number(time.slice(4, 6)),
    ),
  );
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(builtAt);

  return `${commit.slice(0, 7)} - ${formattedDate}`;
}
