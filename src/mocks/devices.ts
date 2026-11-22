import type { Device, DeviceChangeRequest, UserRef } from "@/lib/api/types";

// الأجهزة (I05) وطلبات تغيير الجهاز (I06): GET /devices وGET /device-change-requests. لا تُنقل للإنتاج.

export const devicesNow = "2026-11-18T10:00:00Z";

const tarek: UserRef = { id: 9, name: "طارق النحاس" };
const samer: UserRef = { id: 21, name: "سامر العلي" };
const omar: UserRef = { id: 22, name: "عمر الخطيب" };
const huda: UserRef = { id: 23, name: "هدى العلي" };
const mazen: UserRef = { id: 24, name: "مازن درويش" };
const bishr: UserRef = { id: 25, name: "بشر الحلبي" };
const rasha: UserRef = { id: 26, name: "رشا المعلّم" };

export const devicesList = [
  { id: 1, user: samer, device_id: "a3f9-22c1-7d0e", device_name: "Samsung Galaxy A54", status: "ACTIVE", bound_at: "2025-06-12T08:10:00Z", approved_by: null, last_sync_at: "2026-11-18T08:55:00Z", app_version: "1.4.2" },
  { id: 2, user: omar, device_id: "b81c-0e44-19aa", device_name: "Xiaomi Redmi Note 12", status: "ACTIVE", bound_at: "2025-07-03T09:00:00Z", approved_by: null, last_sync_at: "2026-11-16T17:30:00Z", app_version: "1.4.1" },
  { id: 3, user: huda, device_id: "c55d-9a10-3e72", device_name: "Samsung Galaxy A34", status: "ACTIVE", bound_at: "2026-03-20T07:45:00Z", approved_by: tarek, last_sync_at: "2026-11-18T09:20:00Z", app_version: "1.4.2" },
  { id: 4, user: bishr, device_id: "d014-7bb2-c6f1", device_name: "Oppo A78", status: "ACTIVE", bound_at: "2026-11-02T06:30:00Z", approved_by: null, last_sync_at: "2026-11-18T07:05:00Z", app_version: "1.4.2" },
  { id: 5, user: rasha, device_id: "e7a2-5f3c-80d9", device_name: null, status: "ACTIVE", bound_at: "2026-09-14T08:00:00Z", approved_by: tarek, last_sync_at: null, app_version: "1.3.0" },
  { id: 6, user: huda, device_id: "f2b8-11ce-4a05", device_name: "Samsung Galaxy A12", status: "REVOKED", bound_at: "2025-05-01T08:00:00Z", approved_by: null, last_sync_at: "2026-03-19T16:40:00Z", app_version: "1.2.0" },
  { id: 7, user: mazen, device_id: "0c9e-6d27-b3a8", device_name: "Huawei Y9", status: "REVOKED", bound_at: "2025-08-21T08:00:00Z", approved_by: null, last_sync_at: "2026-10-02T16:00:00Z", app_version: "1.3.4" },
] satisfies Device[];

const device = (id: number) => devicesList.find((item) => item.id === id) ?? null;

export const deviceRequests = [
  { id: 11, user: omar, new_device_id: "9d3e-aa01-55c2", new_device_name: "Samsung Galaxy A55", old_device: device(2), old_device_last_sync_at: "2026-11-16T17:30:00Z", status: "PENDING", requested_at: "2026-11-18T07:40:00Z", decided_by: null, decided_at: null, reason: null },
  { id: 12, user: samer, new_device_id: "7f61-c0b9-2e88", new_device_name: "iPhone 13", old_device: device(1), old_device_last_sync_at: "2026-11-18T08:55:00Z", status: "PENDING", requested_at: "2026-11-18T09:05:00Z", decided_by: null, decided_at: null, reason: null },
  { id: 10, user: huda, new_device_id: "c55d-9a10-3e72", new_device_name: "Samsung Galaxy A34", old_device: device(6), old_device_last_sync_at: "2026-03-19T16:40:00Z", status: "APPROVED", requested_at: "2026-03-20T07:10:00Z", decided_by: tarek, decided_at: "2026-03-20T07:45:00Z", reason: "الجهاز القديم معطّل، والمزامنة الأخيرة قبل يوم." },
  { id: 9, user: rasha, new_device_id: "3a40-ffe2-91b7", new_device_name: "Realme C55", old_device: device(5), old_device_last_sync_at: null, status: "REJECTED", requested_at: "2026-10-05T10:00:00Z", decided_by: tarek, decided_at: "2026-10-05T12:30:00Z", reason: "الطلب لم يُنسَّق مع السوبرفايزر. يُعاد بعد تأكيده." },
] satisfies DeviceChangeRequest[];
