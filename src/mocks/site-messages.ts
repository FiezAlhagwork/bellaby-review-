import type { SiteMessage } from "@/lib/api/types";

// شكاوى موقع الشركة (S12): رسائل من نوع COMPLAINT لا غير، للاطلاع. بعضها «عولجت» بملاحظة مدير المبيعات. الأوقات UTC. لا يُنقل للإنتاج.

const handler = { id: 6, name: "رنا الشامي" };

function complaint(id: number, name: string, phone: string, message: string, createdAt: string, handled?: { at: string; note: string }): SiteMessage {
  return {
    id,
    name,
    phone,
    type: "COMPLAINT",
    message,
    status: handled ? "HANDLED" : "NEW",
    handled_by: handled ? handler : null,
    handled_at: handled?.at ?? null,
    handling_note: handled?.note ?? null,
    created_at: createdAt,
  };
}

export const siteComplaints: readonly SiteMessage[] = [
  complaint(912, "هالة المصري", "+963944100201", "اشتريت علبة حليب المرحلة الأولى من صيدلية في حمص وكانت تاريخ الانتهاء فيها قريباً جداً. أرجو التحقق من توزيع الدفعات.", "2026-11-10T08:20:00Z"),
  complaint(911, "ياسر الأحمد", "+963955100202", "المندوب زارنا مرتين في الأسبوع نفسه دون موعد وأزعج المرضى في العيادة.", "2026-11-09T12:05:00Z"),
  complaint(910, "د. سلوى قاسم", "+963933100203", "طلبت عينات للمرحلة الثانية منذ أسبوعين ولم يصلني شيء رغم الوعد.", "2026-11-08T09:30:00Z"),
  complaint(909, "عمر النجار", "+963944100204", "علبة المرحلة الثانية وصلتني بغطاء مفتوح من الوكيل.", "2026-11-07T15:45:00Z", { at: "2026-11-08T07:10:00Z", note: "حُوّلت إلى مدير المبيعات وسُحبت الدفعة من الوكيل للفحص." }),
  complaint(908, "لمى حداد", "+963955100205", "سعر المنتج في الصيدلية أعلى من السعر المعلن على الموقع.", "2026-11-06T10:00:00Z", { at: "2026-11-07T08:00:00Z", note: "السعر المعلن للمستهلك وفيه هامش الصيدلية. أُبلغت الشاكية." }),
  complaint(907, "فادي العلي", "+963933100206", "لا أجد الموقع على الهاتف بشكل صحيح، الأزرار تتراكب.", "2026-11-05T18:20:00Z"),
  complaint(906, "رنا خوري", "+963944100207", "اتصلت بالرقم المنشور على الموقع ولم يجب أحد طوال يومين.", "2026-11-04T11:15:00Z", { at: "2026-11-05T09:00:00Z", note: "الرقم أُصلح وأُعيد الاتصال بها." }),
  complaint(905, "محمد الشامي", "+963955100208", "صيدلية في اللاذقية تبيع المنتج دون برّاد وهي تعرّضه للشمس.", "2026-11-03T13:40:00Z"),
  complaint(904, "ميساء ديب", "+963933100209", "طلبت استشارة غذائية ولم يردّ أحد على الرسالة.", "2026-11-02T09:05:00Z", { at: "2026-11-03T08:30:00Z", note: "أُحيلت إلى المكتب العلمي." }),
];

// ————— رسائل الموقع كلها لمدير المبيعات (M11): استفسارات وطلبات شراء من الصيدليات والشكاوى أعلاه. الجديدة أولاً ثم بالأحدث. —————

function message(id: number, type: NonNullable<SiteMessage["type"]>, name: string, phone: string, text: string, createdAt: string, handled?: { at: string; note: string }): SiteMessage {
  return {
    id,
    name,
    phone,
    type,
    message: text,
    status: handled ? "HANDLED" : "NEW",
    handled_by: handled ? handler : null,
    handled_at: handled?.at ?? null,
    handling_note: handled?.note ?? null,
    created_at: createdAt,
  };
}

const others: readonly SiteMessage[] = [
  message(920, "INQUIRY", "منى الخطيب", "+963944100301", "هل تتوفر المرحلة الثانية خالية من اللاكتوز؟ وما الفرق بينها وبين المرحلة الثانية العادية؟", "2026-11-10T07:40:00Z"),
  message(919, "PHARMACY_PURCHASE", "صيدلية الربيع", "+963955100302", "نرغب بشراء المنتجات لصيدليتنا في حمص بالجملة. من هو الوكيل المسؤول عن منطقتنا؟", "2026-11-09T14:10:00Z"),
  message(918, "INQUIRY", "أحمد الصالح", "+963933100303", "ما عمر الطفل المناسب لسيريلاك الأرز وهل يحتوي على سكر مضاف؟", "2026-11-09T10:25:00Z"),
  message(917, "PHARMACY_PURCHASE", "صيدلية الأصالة", "+963944100304", "نبحث عن وكيل لمنطقة القامشلي. نرجو التواصل مع مسؤول المبيعات.", "2026-11-08T16:00:00Z"),
  message(916, "INQUIRY", "ريم الدباغ", "+963955100305", "أين أجد منتجاتكم في اللاذقية؟", "2026-11-07T09:15:00Z", { at: "2026-11-07T12:00:00Z", note: "أُرسلت إليها قائمة الصيدليات التي يخدمها وكيل الساحل." }),
  message(915, "PHARMACY_PURCHASE", "صيدلية الإيمان", "+963933100306", "نريد زيارة من مندوب المبيعات لعرض الأسعار والعروض.", "2026-11-06T11:30:00Z", { at: "2026-11-06T13:20:00Z", note: "حُوّل الطلب إلى وكيل الياسمين وتواصل معهم." }),
  message(914, "INQUIRY", "سوسن عيسى", "+963944100307", "هل يوجد نشرة مرافقة للمرحلة الأولى بالعربية؟", "2026-11-04T08:45:00Z", { at: "2026-11-05T09:10:00Z", note: "أُرسل ملف النشرة إلى بريدها." }),
  message(913, "PHARMACY_PURCHASE", "صيدلية السنابل", "+963955100308", "ما شروط التعاقد مع الشركة كصيدلية معتمدة في دير الزور؟", "2026-11-03T15:20:00Z"),
];

/** الجديدة أولاً ثم الأحدث، كما يرتّب العرض. */
export const siteMessagesList: readonly SiteMessage[] = [...siteComplaints, ...others].sort((a, b) => {
  if (a.status !== b.status) return a.status === "NEW" ? -1 : 1;
  return Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? "");
});

/** رد `POST /site/messages/{id}/handle` 200: الرسالة معالَجة بملاحظة. */
export function handledMessage(item: SiteMessage, note: string): SiteMessage {
  return { ...item, status: "HANDLED", handled_by: handler, handled_at: "2026-11-10T09:00:00Z", handling_note: note };
}
