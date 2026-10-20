import { inquiryStatuses, type InquiryStatus } from "@/types/db";

export function StatusPill({ status }: { status: InquiryStatus }) {
  const label = inquiryStatuses.find((s) => s.value === status)?.label ?? status;
  return (
    <span className="adm-pill" data-status={status}>
      {label}
    </span>
  );
}
