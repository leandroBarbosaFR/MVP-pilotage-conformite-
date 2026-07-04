// Client Supabase simulé (mode démo) : suffisant pour les lectures des pages
// et quelques écritures en mémoire. Reproduit l'API chaînable utilisée.

import { DEMO_USER_ID } from "@/lib/demo";
import { TABLES } from "@/lib/mock/dataset";

type Row = Record<string, unknown>;
type Pred = (r: Row) => boolean;

function today(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function like(value: unknown, pattern: string): boolean {
  const needle = pattern.replace(/%/g, "").toLowerCase();
  return String(value ?? "").toLowerCase().includes(needle);
}

function parseOr(expr: string): Pred {
  const parts = expr.split(",");
  const preds: Pred[] = parts.map((p) => {
    const [col, op, ...rest] = p.split(".");
    const raw = rest.join(".");
    switch (op) {
      case "eq":
        return (r) => String(r[col]) === raw;
      case "is":
        return (r) => (raw === "null" ? r[col] == null : r[col] === (raw === "true"));
      case "ilike":
        return (r) => like(r[col], raw);
      default:
        return () => false;
    }
  });
  return (r) => preds.some((fn) => fn(r));
}

class QueryBuilder implements PromiseLike<{ data: unknown; error: null; count: number | null }> {
  private rows: Row[];
  private preds: Pred[] = [];
  private _order: { col: string; asc: boolean; nullsFirst: boolean } | null = null;
  private _from = 0;
  private _to = Infinity;
  private _limit = Infinity;
  private _single = false;
  private _count: string | null = null;
  private _head = false;
  private _write: { type: "insert" | "update" | "upsert" | "delete"; payload?: unknown; onConflict?: string } | null = null;

  constructor(private table: string) {
    this.rows = TABLES[table] ?? [];
  }

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.count) this._count = opts.count;
    if (opts?.head) this._head = true;
    return this;
  }
  eq(col: string, val: unknown) { this.preds.push((r) => r[col] === val); return this; }
  neq(col: string, val: unknown) { this.preds.push((r) => r[col] !== val); return this; }
  gt(col: string, val: unknown) { this.preds.push((r) => r[col] != null && (r[col] as never) > (val as never)); return this; }
  gte(col: string, val: unknown) { this.preds.push((r) => r[col] != null && (r[col] as never) >= (val as never)); return this; }
  lt(col: string, val: unknown) { this.preds.push((r) => r[col] != null && (r[col] as never) < (val as never)); return this; }
  lte(col: string, val: unknown) { this.preds.push((r) => r[col] != null && (r[col] as never) <= (val as never)); return this; }
  is(col: string, val: unknown) { this.preds.push((r) => (val === null ? r[col] == null : r[col] === val)); return this; }
  in(col: string, arr: unknown[]) { const set = new Set(arr); this.preds.push((r) => set.has(r[col])); return this; }
  not(col: string, op: string, val: unknown) {
    if (op === "is" && val === null) this.preds.push((r) => r[col] != null);
    return this;
  }
  ilike(col: string, pattern: string) { this.preds.push((r) => like(r[col], pattern)); return this; }
  or(expr: string) { this.preds.push(parseOr(expr)); return this; }
  match(obj: Row) { for (const k of Object.keys(obj)) this.eq(k, obj[k]); return this; }
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this._order = { col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst ?? false };
    return this;
  }
  range(from: number, to: number) { this._from = from; this._to = to; return this; }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; return this; }

  insert(payload: unknown) { this._write = { type: "insert", payload }; return this; }
  update(payload: unknown) { this._write = { type: "update", payload }; return this; }
  upsert(payload: unknown, opts?: { onConflict?: string }) { this._write = { type: "upsert", payload, onConflict: opts?.onConflict }; return this; }
  delete() { this._write = { type: "delete" }; return this; }

  private matched(): Row[] {
    return this.rows.filter((r) => this.preds.every((p) => p(r)));
  }

  private runWrite() {
    const w = this._write!;
    const inserted: Row[] = [];
    if (w.type === "insert" || w.type === "upsert") {
      const items = Array.isArray(w.payload) ? w.payload : [w.payload];
      for (const item of items as Row[]) {
        if (w.type === "upsert" && w.onConflict) {
          const existing = this.rows.find((r) => r[w.onConflict!] === item[w.onConflict!]);
          if (existing) { Object.assign(existing, item, { updated_at: new Date().toISOString() }); inserted.push(existing); continue; }
        }
        const row: Row = {
          id: (item.id as string) ?? `${this.table}-${Math.round(performance.now() * 1000)}-${this.rows.length}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_archived: false,
          ...item,
        };
        this.rows.push(row);
        inserted.push(row);
      }
      const data = this._single ? inserted[0] ?? null : inserted;
      return { data, error: null, count: null };
    } else if (w.type === "update") {
      for (const r of this.matched()) Object.assign(r, w.payload, { updated_at: new Date().toISOString() });
    } else if (w.type === "delete") {
      for (const r of this.matched()) {
        const idx = this.rows.indexOf(r);
        if (idx >= 0) this.rows.splice(idx, 1);
      }
    }
    return { data: null, error: null, count: null };
  }

  private runRead() {
    let out = this.matched();
    const count = out.length;
    if (this._order) {
      const { col, asc, nullsFirst } = this._order;
      out = [...out].sort((a, b) => {
        const av = a[col], bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return nullsFirst ? -1 : 1;
        if (bv == null) return nullsFirst ? 1 : -1;
        if ((av as never) < (bv as never)) return asc ? -1 : 1;
        if ((av as never) > (bv as never)) return asc ? 1 : -1;
        return 0;
      });
    }
    if (this._from > 0 || this._to !== Infinity) out = out.slice(this._from, this._to + 1);
    if (this._limit !== Infinity) out = out.slice(0, this._limit);
    if (this._single) return { data: out[0] ?? null, error: null, count: this._count ? count : null };
    if (this._head) return { data: null, error: null, count };
    return { data: out, error: null, count: this._count ? count : null };
  }

  then<TResult1 = { data: unknown; error: null; count: number | null }, TResult2 = never>(
    onfulfilled?: ((v: { data: unknown; error: null; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const result = this._write ? this.runWrite() : this.runRead();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

function dashboardStats(companyId: string) {
  const t = today();
  const in30 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();
  const obl = (TABLES.obligations as Row[]).filter((o) => o.company_id === companyId && !o.is_archived);
  const docs = (TABLES.documents as Row[]).filter((d) => d.company_id === companyId && !d.is_archived);
  const acts = (TABLES.actions as Row[]).filter((a) => a.company_id === companyId && !a.is_archived);
  const notifs = (TABLES.notifications as Row[]).filter((n) => n.company_id === companyId);
  const withDoc = new Set(docs.map((d) => d.obligation_id).filter(Boolean));
  const due = (o: Row) => o.due_date as string | null;
  return {
    stats: {
      obligations_ok: obl.filter((o) => !due(o) || (due(o) as string) > in30).length,
      obligations_soon: obl.filter((o) => due(o) && (due(o) as string) >= t && (due(o) as string) <= in30).length,
      obligations_expired: obl.filter((o) => due(o) && (due(o) as string) < t).length,
      obligations_total: obl.length,
      obligations_without_responsible: obl.filter((o) => o.responsible_id == null).length,
      missing_documents: obl.filter((o) => !withDoc.has(o.id)).length,
    },
    overdue_actions: acts.filter((a) => a.status !== "DONE" && a.due_date && (a.due_date as string) < t).length,
    pending_notifications: notifs.filter((n) => !n.is_read).length,
    expired_documents: docs.filter((d) => d.expiration_date && (d.expiration_date as string) < t).length,
  };
}

export function createMockClient() {
  return {
    from(table: string) {
      return new QueryBuilder(table);
    },
    rpc(name: string, params?: Record<string, unknown>) {
      if (name === "get_dashboard_stats") {
        return Promise.resolve({ data: dashboardStats((params?.p_company_id as string) ?? ""), error: null });
      }
      if (name === "load_demo_data") {
        return Promise.resolve({ data: "Données de démonstration déjà disponibles (mode démo).", error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      async getUser() { return { data: { user: { id: DEMO_USER_ID } }, error: null }; },
      async getSession() { return { data: { session: { user: { id: DEMO_USER_ID } } }, error: null }; },
      async signInWithPassword() { return { data: { user: { id: DEMO_USER_ID }, session: {} }, error: null }; },
      async signUp() { return { data: { user: { id: DEMO_USER_ID }, session: {} }, error: null }; },
      async signOut() { return { error: null }; },
    },
    storage: {
      from() {
        return {
          async upload() { return { data: { path: "" }, error: null }; },
          getPublicUrl() { return { data: { publicUrl: "" } }; },
          async createSignedUrl() { return { data: { signedUrl: "" }, error: null }; },
          async remove() { return { data: [], error: null }; },
        };
      },
    },
  };
}
