import Image from "next/image";
import Link from "next/link";
import logo from "../public/valtrix-logo.webp";

export function Brand() {
  return <Link className="brand" href="/" aria-label="VALTRIX home">
    <Image className="brand-logo" src={logo} alt="" sizes="(max-width: 480px) 142px, 180px" />
  </Link>;
}
