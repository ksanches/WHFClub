import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMPTY_EVENT, EVENT_FIELDS, type WhfEvent } from "@/lib/event";

export const Route = createFileRoute("/_authenticated/eventos")({
  component: EventsAdminPage,
});

type Draft = Record<string, string>;

function toDraft(ev: WhfEvent | null): Draft {
  const base: Draft = {};
  Object.entries(ev ?? EMPTY_EVENT).forEach(([k, v]) => {
    if (k === "id" || k === "active" || k === "created_at") return;
    base[k] = (v as string | null) ?? "";
  });
  Object.keys(EMPTY_EVENT).forEach((k) => {
    if (base[k] === undefined) base[k] = "";
  });
  return base;
}

function EventsAdminPage() {
  const [events, setEvents] = useState<WhfEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WhfEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(toDraft(null));
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("events" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar eventos.");
    setEvents(((data as unknown as WhfEvent[]) ?? []));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft(toDraft(null));
  }

  function startEdit(ev: WhfEvent) {
    setCreating(false);
    setEditing(ev);
    setDraft(toDraft(ev));
  }

  function cancel() {
    setEditing(null);
    setCreating(false);
  }

  async function save() {
    if (!draft["name"]?.trim()) return toast.error("Informe o nome interno do evento.");
    if (!draft["hero_title"]?.trim()) return toast.error("Informe o título principal.");
    if (!draft["date_label"]?.trim()) return toast.error("Informe a data do evento.");

    const payload: Record<string, string | null> = {};
    Object.entries(draft).forEach(([k, v]) => { payload[k] = v.trim() === "" ? null : v; });
    payload["name"] = draft["name"].trim();
    payload["hero_title"] = draft["hero_title"];
    payload["date_label"] = draft["date_label"].trim();

    setSaving(true);
    const q = editing
      ? supabase.from("events" as never).update(payload as never).eq("id", editing.id)
      : supabase.from("events" as never).insert(payload as never);
    const { error } = await q;
    setSaving(false);
    if (error) { console.error(error); return toast.error("Não foi possível salvar o evento."); }
    toast.success(editing ? "Evento atualizado." : "Evento criado.");
    cancel();
    load();
  }

  async function activate(ev: WhfEvent) {
    const { error } = await supabase.from("events" as never).update({ active: true } as never).eq("id", ev.id);
    if (error) return toast.error("Não foi possível ativar o evento.");
    toast.success(`"${ev.name}" agora é o evento da página principal.`);
    load();
  }

  async function remove(ev: WhfEvent) {
    if (ev.active) return toast.error("Desative ou ative outro evento antes de excluir este.");
    if (!confirm(`Excluir o evento "${ev.name}"?`)) return;
    const { error } = await supabase.from("events" as never).delete().eq("id", ev.id);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Evento excluído.");
    load();
  }

  const showForm = creating || !!editing;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-primary">Eventos · WHF</h1>
        <Link to="/admin" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          ← Painel admin
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            O evento marcado como <span className="text-foreground font-medium">ativo</span> é o que aparece na página principal.
          </p>
          {!showForm && (
            <button onClick={startCreate} className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-widest">
              Novo evento
            </button>
          )}
        </div>

        {showForm && (
          <section className="rounded-lg border border-accent/40 bg-card p-6 space-y-5">
            <h2 className="font-display text-xl">{editing ? `Editar: ${editing.name}` : "Novo evento"}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {EVENT_FIELDS.map((f) => (
                <label key={f.key} className={f.multiline ? "md:col-span-2 block" : "block"}>
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{f.label}</span>
                  {f.multiline ? (
                    <textarea
                      rows={3}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  )}
                  {f.hint && <span className="mt-1 block text-[11px] text-muted-foreground">{f.hint}</span>}
                </label>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button onClick={save} disabled={saving}
                className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-widest disabled:opacity-60">
                {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar evento"}
              </button>
              <button onClick={cancel} className="rounded-full border border-border px-6 py-2.5 text-xs uppercase tracking-widest">
                Cancelar
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Os preços e o QR Code do Pix continuam sendo gerenciados na seção <span className="text-foreground">Lotes</span> do painel admin.
            </p>
          </section>
        )}

        <section className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando eventos…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>
          ) : (
            events.map((ev) => (
              <article key={ev.id} className={`rounded-lg border p-5 ${ev.active ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg">{ev.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.date_label}{ev.time_label ? ` · ${ev.time_label}` : ""}{ev.venue_name ? ` · ${ev.venue_name}` : ""}
                    </p>
                  </div>
                  {ev.active && (
                    <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] uppercase tracking-widest">
                      Na página principal
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => startEdit(ev)} className="rounded-full border border-border px-4 py-1.5 text-[11px] uppercase tracking-widest hover:border-accent">
                    Editar
                  </button>
                  {!ev.active && (
                    <button onClick={() => activate(ev)} className="rounded-full border border-accent px-4 py-1.5 text-[11px] uppercase tracking-widest hover:bg-accent/10">
                      Publicar na página
                    </button>
                  )}
                  {!ev.active && (
                    <button onClick={() => remove(ev)} className="rounded-full border border-destructive/50 text-destructive px-4 py-1.5 text-[11px] uppercase tracking-widest hover:bg-destructive/10">
                      Excluir
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/40";
