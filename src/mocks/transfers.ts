import type { Transfer } from "@/lib/api/types";

// بيانات المعرض: صرفيات بأنواع العقد. أسماء وأرقام واقعية الشكل.
const warehouse = { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي" } as const;

export const transfers = [
  { id: 154, reference: "TRF-000154", from_location: warehouse, to_location: { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع" }, status: "IN_TRANSIT", total_quantity: 360, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-09T11:05:00Z" },
  { id: 155, reference: "TRF-000155", from_location: warehouse, to_location: { id: 9, type: "AGENT", name: "مؤسسة النور للتوزيع" }, status: "RECEIVED", total_quantity: 1200, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-08T08:40:00Z" },
  { id: 156, reference: "TRF-000156", from_location: warehouse, to_location: { id: 14, type: "REP", name: "سامر الحلبي" }, status: "RECEIVED", total_quantity: 48, created_by: { id: 4, name: "ليلى الأحمد" }, created_at: "2026-11-08T07:15:00Z" },
  { id: 157, reference: "TRF-000157", from_location: warehouse, to_location: { id: 21, type: "AGENT", name: "شركة الفرات للأغذية" }, status: "CANCELLED", total_quantity: 240, created_by: { id: 4, name: "ليلى الأحمد" }, created_at: "2026-11-07T13:30:00Z" },
  { id: 158, reference: "TRF-000158", from_location: warehouse, to_location: { id: 8, type: "AGENT", name: "وكالة الساحل للتوزيع" }, status: "IN_TRANSIT", total_quantity: 2400, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-07T09:00:00Z" },
  { id: 159, reference: "TRF-000159", from_location: warehouse, to_location: { id: 15, type: "REP", name: "عمر الخطيب" }, status: "RECEIVED", total_quantity: 96, created_by: { id: 4, name: "ليلى الأحمد" }, created_at: "2026-11-06T10:20:00Z" },
  { id: 160, reference: "TRF-000160", from_location: warehouse, to_location: { id: 12, type: "AGENT", name: "مؤسسة الشام للتجارة" }, status: "RECEIVED", total_quantity: 720, created_by: { id: 3, name: "رامي السيد" }, created_at: "2026-11-05T12:10:00Z" },
  { id: 161, reference: "TRF-000161", from_location: warehouse, to_location: { id: 16, type: "REP", name: "هدى العلي" }, status: "IN_TRANSIT", total_quantity: 60, created_by: { id: 4, name: "ليلى الأحمد" }, created_at: "2026-11-05T08:00:00Z" },
] satisfies Transfer[];
