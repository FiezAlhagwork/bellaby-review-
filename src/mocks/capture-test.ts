import type { Transfer } from "@/lib/api/types";

// بيانات صفحة /capture-test: ثلاثة صفوف من الصرف بأنواع العقد.
export const captureTestTransfers = [
  {
    id: 154,
    reference: "TRF-000154",
    to_location: { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع" },
    total_quantity: 360,
  },
  {
    id: 155,
    reference: "TRF-000155",
    to_location: { id: 9, type: "AGENT", name: "مؤسسة النور للتوزيع" },
    total_quantity: 1200,
  },
  {
    id: 156,
    reference: "TRF-000156",
    to_location: { id: 14, type: "REP", name: "سامر الحلبي" },
    total_quantity: 48,
  },
] satisfies Transfer[];
