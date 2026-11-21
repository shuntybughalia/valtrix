import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return <Link className="brand" href="/" aria-label="VALTRIX home">
    <Image className="brand-logo" src="/valtrix-logo.webp" width={740} height={198} alt="" unoptimized />
  </Link>;
}
