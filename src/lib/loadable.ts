/** حالة بيانات الـ view: كل شاشة فيها داتا من الخادم تستقبلها كما هي (CLAUDE.md «الـ views»). */
export type Loadable<T> =
  | { status: "loading" }
  | { status: "error"; code: string }
  | { status: "ready"; data: T };
