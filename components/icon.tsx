const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chart: "M4 4v16h16M8 15l4-4 3 2 5-6",
  check: "m5 12 4 4L19 6",
  file: "M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Zm0 0v7h7M8 13h8m-8 4h6",
  grid: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  history: "M3 12a9 9 0 1 1 3 6.7M3 12V6m0 6h6m3-5v5l3 2",
  search: "M21 21l-4.5-4.5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  target: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-4 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
};

export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}
