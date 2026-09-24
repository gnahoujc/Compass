// Flag SVGs from the `flag-icons` package (MIT). Vite emits each file as a
// separate asset, so a flag is only downloaded when it is first shown.
const urls = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
});

export function flagUrl(code: string): string | undefined {
  return urls[`/node_modules/flag-icons/flags/4x3/${code}.svg`];
}
