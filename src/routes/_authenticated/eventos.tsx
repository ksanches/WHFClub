import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMPTY_EVENT, EVENT_FIELDS, type WhfEvent } from "@/lib/event";

export const Route = createFileRoute("/_authenticated/eventos")({
  component: EventsAdminPage,
});

type Draft = Record<string, string>;

interface Ticket {
  id: string;
  event_id: string | null;
  label: string;
  total: number;
  capacity: number;
  individual_price_cents: number;
  dupla_price_cents: number;
  card_url_individual: string | null;
  card_url_dupla: string | null;
  pix_qr_individual_url: string | null;
  pix_qr_dupla_url: string | null;
  active: boolean;
  sort_order: number;
}

interface TicketDraft {
  label: string;
  capacity: string;
  individual: string;
  hasDupla: boolean;
  dupla: string;
  cardIndividual: string;
  cardDupla: string;
  pixIndividual: string;
  pixDupla: string;
}

const EMPTY_TICKET: TicketDraft = {
  label: "",
  capacity: "15",
  individual: "0,00",
  hasDupla: false,
  dupla: "0,00",
  cardIndividual: "",
  cardDupla: "",
  pixIndividual: "",
  pixDupla: "",
};

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

function toTicketDraft(t: Ticket | null, eventName: string): TicketDraft {
  if (!t) return { ...EMPTY_TICKET, label: eventName };
  return {
    label: t.label,
    capacity: String(t.capacity ?? 15),
    individual: (t.individual_price_cents / 100).toFixed(2).replace(".", ","),
    hasDupla: (t.dupla_price_cents ?? 0) > 0,
    dupla: (t.dupla_price_cents / 100).toFixed(2).replace(".", ","),
    cardIndividual: t.card_url_individual ?? "",
    cardDupla: t.card_url_dupla ?? "",
    pixIndividual: t.pix_qr_individual_url ?? "",
    pixDupla: t.pix_qr_dupla_url ?? "",
  };
}

function toCents(v: string): number {
  const n = parseFloat(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

function slugify(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

function EventsAdminPage() {
  const search = useSearch({ from: "/_authenticated/eventos" });
  const [events, setEvents] = useState<WhfEvent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WhfEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(toDraft(null));
  const [ticket, setTicket] = useState<TicketDraft>(EMPTY_TICKET);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [evRes, lotRes] = await Promise.all([
      supabase.from("events" as never).select("*").order("created_at", { ascending: false }),
      supabase.from("lots" as never).select("*").order("sort_order", { ascending: true }),
    ]);
    if (evRes.error || lotRes.error) toast.error("Erro ao carregar eventos.");
    setEvents((evRes.data as unknown as WhfEvent[]) ?? []);
    setTickets((lotRes.data as unknown as Ticket[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (search.create && !creating && !editing) {
      startCreate();
    }
  }, [search.create]);

  function ticketOf(ev: WhfEvent): Ticket | null {
    return tickets.find((t) => t.event_id === ev.id) ?? null;
  }

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft(toDraft(null));
    setTicket(EMPTY_TICKET);
  }

  function startEdit(ev: WhfEvent) {
    setCreating(false);
    setEditing(ev);
    setDraft(toDraft(ev));
    setTicket(toTicketDraft(ticketOf(ev), ev.name));
  }

  function cancel() {
    setEditing(null);
    setCreating(false);
  }

  async function save(publish: boolean) {
    if (!draft["name"]?.trim()) return toast.error("Informe o nome interno do evento.");
    if (!draft["hero_title"]?.trim()) return toast.error("Informe o título principal.");
    if (!draft["date_label"]?.trim()) return toast.error("Informe a data do evento.");

    const indCents = toCents(ticket.individual);
    if (!Number.isFinite(indCents) || indCents < 0) return toast.error("Informe o valor do ingresso individual.");
    const dupCents = ticket.hasDupla ? toCents(ticket.dupla) : 0;
    if (!Number.isFinite(dupCents)) return toast.error("Informe o valor do ingresso em dupla.");
    const capacity = parseInt(ticket.capacity || "0", 10);
    if (!Number.isFinite(capacity) || capacity <= 0) return toast.error("Informe o limite de inscrições.");

    const payload: Record<string, string | null> = {};
    Object.entries(draft).forEach(([k, v]) => {
      payload[k] = v.trim() === "" ? null : v;
    });
    payload["name"] = draft["name"].trim();
    payload["hero_title"] = draft["hero_title"];
    payload["date_label"] = draft["date_label"].trim();

    setSaving(true);
    try {
      let eventId = editing?.id ?? "";
      if (editing) {
        const { error } = await supabase.from("events" as never).update(payload as never).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("events" as never)
          .insert(payload as never)
          .select("id")
          .single();
        if (error) throw error;
        eventId = (data as unknown as { id: string }).id;
      }

      const existing = editing ? ticketOf(editing) : null;
      const ticketPayload = {
        label: ticket.label.trim() || payload["name"]!,
        total: capacity,
        capacity,
        individual_price_cents: indCents,
        dupla_price_cents: dupCents,
        card_url_individual: ticket.cardIndividual.trim() || null,
        card_url_dupla: ticket.cardDupla.trim() || null,
        pix_qr_individual_url: ticket.pixIndividual.trim() || null,
        pix_qr_dupla_url: ticket.pixDupla.trim() || null,
        event_id: eventId,
      };

      if (existing) {
        const { error } = await supabase.from("lots" as never).update(ticketPayload as never).eq("id", existing.id);
        if (error) throw error;
      } else {
        const maxOrder = tickets.reduce((m, t) => Math.max(m, t.sort_order ?? 0), 0);
        const id = `${slugify(payload["name"]!) || "evento"}-${Date.now().toString(36)}`;
        const { error } = await supabase
          .from("lots" as never)
          .insert({ ...ticketPayload, id, sort_order: maxOrder + 1, active: false } as never);
        if (error) throw error;
      }

      if (publish) await publishEvent(eventId);

      toast.success(publish ? "Evento publicado na página principal." : editing ? "Evento atualizado." : "Evento criado.");
      cancel();
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar o evento.");
    } finally {
      setSaving(false);
    }
  }

  async function publishEvent(eventId: string) {
    await supabase.from("events" as never).update({ active: true } as never).eq("id", eventId);
    await supabase.from("lots" as never).update({ active: false } as never).neq("event_id", eventId);
    await supabase.from("lots" as never).update({ active: true } as never).eq("event_id", eventId);
  }

  async function activate(ev: WhfEvent) {
    if (!ticketOf(ev)) return toast.error("Cadastre os dados de ingresso antes de publicar.");
    await publishEvent(ev.id);
    toast.success(`"${ev.name}" agora é o evento da página principal.`);
    load();
  }

  async function remove(ev: WhfEvent) {
    if (ev.active) return toast.error("Publique outro evento antes de excluir este.");
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
            O evento <span className="text-foreground font-medium">publicado</span> é o que aparece na página principal, com seus preços e Pix.
          </p>
          {!showForm && (
            <button
              onClick={startCreate}
              className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-widest whitespace-nowrap"
            >
              + Criar evento
            </button>
          )}
        </div>

        {showForm && (
          <section className="rounded-lg border border-accent/40 bg-card p-6 space-y-6">
            <h2 className="font-display text-xl">{editing ? `Editar: ${editing.name}` : "Criar evento"}</h2>

            <div>
              <p className="text-xs uppercase tracking-widest text-accent mb-3">1 · Conteúdo da página</p>
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
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs uppercase tracking-widest text-accent my-3">2 · Ingressos e pagamento</p>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Nome do ingresso</span>
                  <input
                    value={ticket.label}
                    onChange={(e) => setTicket((t) => ({ ...t, label: e.target.value }))}
                    placeholder={draft["name"] || "Ex.: Talk with WHF"}
                    className={inputCls}
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">Identifica as inscrições deste evento.</span>
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Limite de inscrições</span>
                  <input
                    type="number"
                    min={1}
                    value={ticket.capacity}
                    onChange={(e) => setTicket((t) => ({ ...t, capacity: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Valor individual (R$)</span>
                  <input
                    inputMode="decimal"
                    value={ticket.individual}
                    onChange={(e) => setTicket((t) => ({ ...t, individual: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <div className="block">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Ingresso em dupla</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ticket.hasDupla}
                      onChange={(e) => setTicket((t) => ({ ...t, hasDupla: e.target.checked }))}
                    />
                    Oferecer ingresso em dupla
                  </label>
                  {ticket.hasDupla && (
                    <input
                      inputMode="decimal"
                      value={ticket.dupla}
                      onChange={(e) => setTicket((t) => ({ ...t, dupla: e.target.value }))}
                      placeholder="Valor por pessoa (R$)"
                      className={`${inputCls} mt-2`}
                    />
                  )}
                </div>
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Link cartão · individual</span>
                  <input
                    value={ticket.cardIndividual}
                    onChange={(e) => setTicket((t) => ({ ...t, cardIndividual: e.target.value }))}
                    placeholder="https://link.infinitepay.io/..."
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Link cartão · dupla</span>
                  <input
                    value={ticket.cardDupla}
                    onChange={(e) => setTicket((t) => ({ ...t, cardDupla: e.target.value }))}
                    placeholder="https://link.infinitepay.io/..."
                    className={inputCls}
                  />
                </label>
                <QrUpload
                  label="QR Code Pix · individual"
                  value={ticket.pixIndividual}
                  onChange={(v) => setTicket((t) => ({ ...t, pixIndividual: v }))}
                  folder={`events/${slugify(draft["name"] || "evento")}/individual`}
                />
                {ticket.hasDupla && (
                  <QrUpload
                    label="QR Code Pix · dupla"
                    value={ticket.pixDupla}
                    onChange={(v) => setTicket((t) => ({ ...t, pixDupla: v }))}
                    folder={`events/${slugify(draft["name"] || "evento")}/dupla`}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-2 border-t border-border">
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-widest disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Publicar na página"}
              </button>
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="rounded-full border border-accent px-6 py-2.5 text-xs uppercase tracking-widest disabled:opacity-60"
              >
                Salvar sem publicar
              </button>
              <button onClick={cancel} className="rounded-full border border-border px-6 py-2.5 text-xs uppercase tracking-widest">
                Cancelar
              </button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando eventos…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento cadastrado ainda.</p>
          ) : (
            events.map((ev) => {
              const t = ticketOf(ev);
              return (
                <article
                  key={ev.id}
                  className={`rounded-lg border p-5 ${ev.active ? "border-accent bg-accent/5" : "border-border bg-card"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.date_label}
                        {ev.time_label ? ` · ${ev.time_label}` : ""}
                        {ev.venue_name ? ` · ${ev.venue_name}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t
                          ? `${(t.individual_price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · limite ${t.capacity}`
                          : "Sem ingresso configurado"}
                      </p>
                    </div>
                    {ev.active && (
                      <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] uppercase tracking-widest">
                        Na página principal
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => startEdit(ev)}
                      className="rounded-full border border-border px-4 py-1.5 text-[11px] uppercase tracking-widest hover:border-accent"
                    >
                      Editar
                    </button>
                    {!ev.active && (
                      <button
                        onClick={() => activate(ev)}
                        className="rounded-full border border-accent px-4 py-1.5 text-[11px] uppercase tracking-widest hover:bg-accent/10"
                      >
                        Publicar na página
                      </button>
                    )}
                    {!ev.active && (
                      <button
                        onClick={() => remove(ev)}
                        className="rounded-full border border-destructive/50 text-destructive px-4 py-1.5 text-[11px] uppercase tracking-widest hover:bg-destructive/10"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

function QrUpload({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("payment-assets")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
    setUploading(false);
    if (error) return toast.error(`Falha no upload: ${error.message}`);
    const { data } = supabase.storage.from("payment-assets").getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("QR Code enviado.");
  }

  return (
    <div className="block">
      <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="URL da imagem" className={inputCls} />
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="mt-2 block w-full text-[11px] text-muted-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-background file:px-3 file:py-1 file:text-[10px] file:uppercase file:tracking-widest"
      />
      {value && <img src={value} alt={label} className="mt-2 h-24 w-24 rounded border border-border object-contain" />}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/40";
