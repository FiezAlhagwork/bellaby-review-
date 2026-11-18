import type { ScientificOverview } from "@/features/scientific-office/views/ScientificDashboardView";
import { coverageLines } from "./sales";
import { visitPointsList } from "./visit-points-list";

// لوحة المكتب العلمي (M12): خطة تشرين الثاني 2026 حتى 10 منه، والتغطية لكل محافظة، وزيارات اليوم على الخريطة. لا يُنقل للإنتاج.

const active = visitPointsList.filter((point) => point.status === "ACTIVE" && point.location);

export const scientificOverview: ScientificOverview = {
  month: "2026-11",
  hasPlan: true,
  visits: { actual: 412, target: 1100 },
  categoryVisits: { actual: 188, target: 520 },
  itemDiscussions: { actual: 640, target: 1500 },
  coverage: coverageLines,
  mapVisits: active.map((point, index) => ({ id: point.id ?? index, lat: point.location!.lat, lng: point.location!.lng, label: `زيارة ${point.name ?? ""}`, flagged: index === 2 })),
};

export const scientificNoPlan: ScientificOverview = { ...scientificOverview, hasPlan: false };
