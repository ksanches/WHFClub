import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { formatCents } from "@/lib/whf";
import type { WhfEvent } from "@/lib/event";

export const Route = createFileRoute("/_authenticated/evento/$id")({
  head: () => ({ meta: [
    { title: "Dashboard do evento · WHF" },
    { name: "description", content: "Participantes, financeiro, ingressos e cupons de cada evento WHF." },
    { property: "og:title", content: "Dashboard do evento · WHF" },
    { property: "og:description", content: "Participantes, financeiro, ingressos e cupons de cada evento WHF." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: EventDashboard,
});

type RegStatus = "pendente" | "confirmado" | "cancelado" | "reembolsado";

const STATUS_OPTIONS: { value: RegStatus; label: string; className: string }[] = [
  { value: "pendente", label: "Pendente", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30" },
  { value: "confirmado", label: "Confirmado", className: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30" },
  { value: "cancelado", label: "Cancelado", className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
  { value: "reembolsado", label: "Reembolsado", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
];

interface Ticket {
  id: string;
  event_id: string | null;
  label: string;
  capacity: number;
  total: number;
  individual_price_cents: number;
  dupla_price_cents: number;
  active: boolean;
  card_url_individual: string | null;
  card_url_dupla: string | null;
  pix_qr_individual_url: string | null;
  pix_qr_dupla_url: string | null;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  individual_price_cents: number | null;
  dupla_price_cents: number | null;
  auto_confirm: boolean;
  valid_for: string;
  active: boolean;
  event_ids: string[];
}

interface Registration {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string | null;
  ticket_batch: string;
  ticket_type: string;
  ticket_price_cents: number;
  class_time: string | null;
  payment_method: string | null;
  status: RegStatus;
  partner_full_name: string | null;
  partner_email: string | null;
  partner_phone: string | null;
  event_suggestions: string | null;
  parq_notes: string | null;
  parq_q1: boolean | null; parq_q2: boolean | null; parq_q3: boolean | null; parq_q4: boolean | null;
  parq_q5: boolean | null; parq_q6: boolean | null; parq_q7: boolean | null;
}

function paymentLabel(m: string | null) {
  if (m === "pix") return "Pix";
  if (m === "cartao") return "Cartão";
  return "—";
}

function EventDashboard() {
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<WhfEvent | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [openRegId, setOpenRegId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | RegStatus>("todos");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const [evRes, lotRes, cpRes] = await Promise.all([
      supabase.from("events" as never).select("*").eq("id", id).maybeSingle(),
      supabase.from("lots" as never).select("*").eq("event_id", id).maybeSingle(),
      supabase.from("coupons" as never).select("*").order("code"),
    ]);
    const ev = (evRes.data as unknown as WhfEvent) ?? null;
    const tk = (lotRes.data as unknown as Ticket) ?? null;
    setEvent(ev);
    setTicket(tk);
    setCoupons((cpRes.data as unknown as Coupon[]) ?? []);

    if (tk) {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("ticket_batch", tk.label)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setRegs((data as unknown as Registration[]) ?? []);
    } else {
      setRegs([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const confirmed = useMemo(() => regs.filter((r) => r.status === "confirmado"), [regs]);
  const seats = (r: Registration) => (r.ticket_type === "dupla" ? 2 : 1);
  const revenue = (r: Registration) => r.ticket_price_cents * seats(r);

  const totalConfirmed = confirmed.reduce((s, r) => s + revenue(r), 0);
  const pending = regs.filter((r) => r.status === "pendente");
  const totalPending = pending.reduce((s, r) => s + revenue(r), 0);
  const participants = confirmed.reduce((s, r) => s + seats(r), 0);
  const capacity = ticket?.capacity ?? 0;
  const pixTotal = confirmed.filter((r) => r.payment_method === "pix").reduce((s, r) => s + revenue(r), 0);
  const cardTotal = confirmed.filter((r) => r.payment_method === "cartao").reduce((s, r) => s + revenue(r), 0);
  const indivCount = confirmed.filter((r) => r.ticket_type === "individual").length;
  const duplaCount = confirmed.filter((r) => r.ticket_type === "dupla").length;

  const eventCoupons = coupons.filter((c) => !c.event_ids?.length || c.event_ids.includes(id));

  const filtered = regs.filter((r) => {
    if (statusFilter !== "todos" && r.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [r.full_name, r.email, r.phone, r.cpf, r.partner_full_name ?? ""].some((v) => v.toLowerCase().includes(q));
  });

  async function updateStatus(reg: Registration, status: RegStatus) {
    const prev = reg.status;
    setRegs((rs) => rs.map((r) => (r.id === reg.id ? { ...r, status } : r)));
    const { error } = await supabase.from("registrations").update({ status } as never).eq("id", reg.id);
    if (error) {
      setRegs((rs) => rs.map((r) => (r.id === reg.id ? { ...r, status: prev } : r)));
      toast.error(error.message);
    } else toast.success("Status atualizado");
  }

  async function deleteReg(reg: Registration) {
    if (!confirm(`Excluir a inscrição de ${reg.full_name}?`)) return;
    const { error } = await supabase.from("registrations").delete().eq("id", reg.id);
    if (error) return toast.error(error.message);
    setRegs((rs) => rs.filter((r) => r.id !== reg.id));
    if (openRegId === reg.id) setOpenRegId(null);
    toast.success("Inscrição excluída");
  }

  function buildRows() {
    const yn = (v: boolean | null) => (v === null || v === undefined ? "" : v ? "SIM" : "não");
    return filtered.map((r) => ({
      Data: new Date(r.created_at).toLocaleString("pt-BR"),
      Status: STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status,
      Nome: r.full_name,
      CPF: r.cpf,
      "E-mail": r.email,
      Telefone: r.phone,
      Endereço: r.address ?? "",
      Evento: r.ticket_batch,
      Tipo: r.ticket_type,
      "Valor (R$)": (revenue(r) / 100).toFixed(2).replace(".", ","),
      Pagamento: paymentLabel(r.payment_method),
      Aula: r.class_time ?? "",
      "Dupla - Nome": r.partner_full_name ?? "",
      "Dupla - E-mail": r.partner_email ?? "",
      "Dupla - Telefone": r.partner_phone ?? "",
      "PARQ 1": yn(r.parq_q1), "PARQ 2": yn(r.parq_q2), "PARQ 3": yn(r.parq_q3), "PARQ 4": yn(r.parq_q4),
      "PARQ 5": yn(r.parq_q5), "PARQ 6": yn(r.parq_q6), "PARQ 7": yn(r.parq_q7),
      "PARQ Observações": r.parq_notes ?? "",
      Sugestões: r.event_suggestions ?? "",
    }));
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function slug() {
    return (event?.name ?? "evento").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function exportCSV() {
    const rows = buildRows();
    if (!rows.length) return toast.error("Nenhuma inscrição para exportar");
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows), { FS: ";" });
    download(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), `inscricoes-${slug()}.csv`);
  }

  function exportXLSX() {
    const rows = buildRows();
    if (!rows.length) return toast.error("Nenhuma inscrição para exportar");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Inscrições");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `inscricoes-${slug()}.xlsx`);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Evento não encontrado.</p>
        <Link to="/eventos" className="text-xs uppercase tracking-widest text-primary">← Eventos</Link>
      </div>
    );
  }

  const openReg = regs.find((r) => r.id === openRegId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <header className="border-b border-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-primary">{event.name}</h1>
          <p className="text-xs text-muted-foreground">
            {event.date_label}
            {event.time_label ? ` · ${event.time_label}` : ""}
            {event.venue_name ? ` · ${event.venue_name}` : ""}
            {event.active ? " · publicado na página principal" : " · não publicado"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/eventos" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">Eventos</Link>
          <Link to="/admin" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">← Painel admin</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        {/* KPIs */}
        <section className="grid md:grid-cols-4 gap-4">
          <Card label="Arrecadado (confirmado)" value={formatCents(totalConfirmed)} sub={`${confirmed.length} inscrição(ões)`} big />
          <Card label="A receber (pendente)" value={formatCents(totalPending)} sub={`${pending.length} pendente(s)`} />
          <Card label="Participantes" value={`${participants}${capacity ? ` / ${capacity}` : ""}`} sub={capacity ? `${Math.max(capacity - participants, 0)} vaga(s) restante(s)` : "sem limite definido"} />
          <Card label="Ticket médio" value={participants > 0 ? formatCents(Math.round(totalConfirmed / participants)) : formatCents(0)} sub="por participante" />
        </section>

        <section className="grid md:grid-cols-4 gap-4">
          <Card label="Pix" value={formatCents(pixTotal)} />
          <Card label="Cartão" value={formatCents(cardTotal)} />
          <Card label="Individuais" value={String(indivCount)} sub="confirmados" />
          <Card label="Duplas" value={String(duplaCount)} sub={`${duplaCount * 2} participantes`} />
        </section>

        {/* Ingresso e pagamento */}
        <section>
          <h2 className="font-display text-xl mb-4">Ingresso e pagamento</h2>
          {ticket ? (
            <div className="rounded-lg border border-border bg-card p-5 grid md:grid-cols-3 gap-5 text-sm">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Ingresso</p>
                <p className="mt-1">{ticket.label}</p>
                <p className="text-muted-foreground">{formatCents(ticket.individual_price_cents)} individual{ticket.dupla_price_cents > 0 ? ` · ${formatCents(ticket.dupla_price_cents)} dupla (por pessoa)` : ""}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Limite: {ticket.capacity} · {ticket.active ? "ativo" : "inativo"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Pix</p>
                <p className="mt-1 break-all">{event.pix_key ?? "—"}</p>
                <p className="text-muted-foreground">{event.pix_beneficiary ?? ""}</p>
                {ticket.pix_qr_individual_url && (
                  <img src={ticket.pix_qr_individual_url} alt="QR Code Pix" className="mt-2 h-24 w-24 rounded border border-border object-contain" />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Links de cartão</p>
                <p className="mt-1 text-[11px] break-all">Individual: {ticket.card_url_individual ?? "—"}</p>
                <p className="text-[11px] break-all">Dupla: {ticket.card_url_dupla ?? "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum ingresso configurado para este evento.</p>
          )}
        </section>

        {/* Cupons */}
        <section>
          <h2 className="font-display text-xl mb-4">Cupons ({eventCoupons.length})</h2>
          {eventCoupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cupom válido para este evento.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {eventCoupons.map((c) => {
                const uses = regs.filter(
                  (r) => c.individual_price_cents != null && r.ticket_price_cents === c.individual_price_cents,
                ).length;
                return (
                  <div key={c.id} className="rounded-lg border border-border bg-card p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg">{c.code}</p>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${c.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {c.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.individual_price_cents != null ? `${formatCents(c.individual_price_cents)} individual` : "sem preço individual"}
                      {c.dupla_price_cents != null ? ` · ${formatCents(c.dupla_price_cents)} dupla` : ""}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {c.event_ids?.length ? "Específico deste evento" : "Vale para todos"} · possíveis usos: {uses}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/admin" className="mt-3 inline-block text-xs uppercase tracking-widest text-primary hover:underline">
            Gerenciar cupons no painel
          </Link>
        </section>

        {/* Participantes */}
        <section>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-display text-xl">Participantes ({filtered.length})</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nome, e-mail, CPF…"
                className="rounded-full border border-border bg-background px-4 py-1.5 text-xs outline-none focus:border-accent"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "todos" | RegStatus)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs uppercase tracking-widest"
              >
                <option value="todos">Todos</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button onClick={exportCSV} className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-secondary">CSV</button>
              <button onClick={exportXLSX} className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs uppercase tracking-widest hover:opacity-90">Excel</button>
              <button onClick={load} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">Atualizar</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left px-3 py-2">Data</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Nome</th>
                  <th className="text-left px-3 py-2">Contato</th>
                  <th className="text-left px-3 py-2">Tipo</th>
                  <th className="text-left px-3 py-2">Valor</th>
                  <th className="text-left px-3 py-2">Pagamento</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === r.status) ?? STATUS_OPTIONS[0];
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2">
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r, e.target.value as RegStatus)}
                          className={`text-xs uppercase tracking-widest rounded-full border px-2 py-1 font-semibold outline-none ${opt.className}`}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {r.full_name}
                        {r.partner_full_name && <div className="text-xs text-muted-foreground">+ {r.partner_full_name}</div>}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div>{r.email}</div>
                        <div className="text-muted-foreground">{r.phone}</div>
                      </td>
                      <td className="px-3 py-2">{r.ticket_type}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatCents(revenue(r))}</td>
                      <td className="px-3 py-2">{paymentLabel(r.payment_method)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-3 justify-end">
                          <button onClick={() => setOpenRegId(r.id)} className="text-xs uppercase tracking-widest text-primary hover:underline">Ver</button>
                          <button onClick={() => deleteReg(r)} className="text-xs uppercase tracking-widest text-destructive hover:underline">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Nenhuma inscrição encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {openReg && <RegDetail reg={openReg} onClose={() => setOpenRegId(null)} />}
    </div>
  );
}

function Card({ label, value, sub, big }: { label: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-5 bg-card">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display mt-1 ${big ? "text-3xl text-primary" : "text-2xl"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

function RegDetail({ reg, onClose }: { reg: Registration; onClose: () => void }) {
  const labels = ["Coração/supervisão", "Dor no peito (ativ.)", "Dor no peito (repouso)", "Tontura/desequilíbrio", "Problema ósseo/articular", "Medicamento coração/pressão", "Outra razão"];
  const parq = [reg.parq_q1, reg.parq_q2, reg.parq_q3, reg.parq_q4, reg.parq_q5, reg.parq_q6, reg.parq_q7];
  const hasParq = parq.some((v) => v !== null && v !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-background rounded-lg border border-accent/40 p-6">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl">{reg.full_name}</h3>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {reg.ticket_batch} · {reg.ticket_type} · {formatCents(reg.ticket_price_cents)} · {paymentLabel(reg.payment_method)}
          {reg.class_time ? ` · aula ${reg.class_time}` : ""}
        </p>

        <div className="mt-5 text-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Contato</p>
          <p>{reg.email} · {reg.phone}</p>
          <p className="text-muted-foreground">CPF: {reg.cpf}</p>
          {reg.address && <p className="text-muted-foreground">{reg.address}</p>}
        </div>

        {reg.partner_full_name && (
          <div className="mt-5 text-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Dupla</p>
            <p>{reg.partner_full_name}</p>
            <p className="text-muted-foreground">{reg.partner_email} · {reg.partner_phone}</p>
          </div>
        )}

        {hasParq && (
          <div className="mt-5 text-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">PAR-Q</p>
            <ul className="space-y-1">
              {labels.map((l, i) => (
                <li key={i} className="flex justify-between">
                  <span>{l}</span>
                  <span className={parq[i] ? "text-destructive font-semibold" : "text-muted-foreground"}>
                    {parq[i] === null || parq[i] === undefined ? "—" : parq[i] ? "SIM" : "não"}
                  </span>
                </li>
              ))}
            </ul>
            {reg.parq_notes && <p className="mt-2 text-muted-foreground italic">"{reg.parq_notes}"</p>}
          </div>
        )}

        {reg.event_suggestions && (
          <div className="mt-5 text-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Sugestões</p>
            <p className="italic">"{reg.event_suggestions}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
