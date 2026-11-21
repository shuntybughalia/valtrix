import Link from "next/link";

export function Brand() {
  return <Link className="brand" href="/" aria-label="VALTRIX home">
    <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m3 5 9 14 9-14M8 5l4 6.5L16 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
    VALTRIX
  </Link>;
}
