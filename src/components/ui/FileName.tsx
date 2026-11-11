import { cn } from "@/lib/cn";

/**
 * اسم ملف في سطر واحد. الامتداد (.pdf) لاتيني بعد اسم عربي فيُعزل اتجاهياً، وإلا ظهرت النقطة في الجهة الخطأ («pdf.»).
 * الاسم نفسه يتبع اتجاه أول حرف فيه (عربي أو لاتيني).
 */
export function FileName({ name, className }: { name: string; className?: string }) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";

  return (
    <span dir="auto" title={name} className={cn("truncate text-start", className)}>
      {base}
      {extension ? <bdi dir="ltr">{extension}</bdi> : null}
    </span>
  );
}
