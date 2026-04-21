import React from "react";
import { Link } from "react-router-dom";
import { resolveReference } from "@/lib/referenceCatalog";

export default function ReferencePill({ referenceId, className = "" }) {
  const reference = resolveReference(referenceId);
  if (!reference) return null;

  return (
    <Link
      to={`/appendix#${reference.id}`}
      className={`inline-flex items-center rounded-full border border-primary/30 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-all hover:border-primary hover:bg-[#e8f7f6] ${className}`}
      title={`Open reference for ${reference.title}`}
    >
      {reference.shortLabel}
    </Link>
  );
}
