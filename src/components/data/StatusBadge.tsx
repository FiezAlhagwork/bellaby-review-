import { Badge } from "@/components/ui/Badge";
import { getStatusDefinition, type StatusEntity, type StatusOf } from "./status-map";

type StatusBadgeProps<Entity extends StatusEntity> = {
  /** نوع الكيان: يحدد جدول الترجمة. */
  entity: Entity;
  /** قيمة الحالة من العقد حرفياً: `status="PENDING"`. */
  status: StatusOf<Entity>;
};

/** شارة الحالة (DESIGN.md 9.9): النص العربي واللون من status-map.ts وحده. */
export function StatusBadge<Entity extends StatusEntity>({ entity, status }: StatusBadgeProps<Entity>) {
  const { label, color } = getStatusDefinition(entity, status);
  return <Badge color={color}>{label}</Badge>;
}
