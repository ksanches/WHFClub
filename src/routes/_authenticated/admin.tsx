import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { CLASS_TIMES, CLASS_CAPACITY, formatCents } from "@/lib/whf";


export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

interface Lot {
  id: string;
  label: string;
  total: number;
  capacity: number;
  individual_price_cents: number;
  dupla_price_cents: number;
  active: boolean;
  sort_order: number;
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
  card_url_individual: string | null;
  card_url_dupla: string | null;
  pix_qr_individual_url: string | null;
  pix_qr_dupla_url: string | null;
  auto_confirm: boolean;
  valid_for: "individual" | "dupla" | "both";
  active: boolean;
  event_ids: string[];
}

interface EventOption {
  id: string;
  name: string;
  active: boolean;
}

type RegStatus = "pendente" | "confirmado" | "cancelado" | "reembolsado";

const STATUS_OPTIONS: { value: RegStatus; label: string; className: string }[] = [
  { value: "pendente", label: "Pendente", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30" },
  { value: "confirmado", label: "Confirmado", className: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30" },
  { value: "cancelado", label: "Cancelado", className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
  { value: "reembolsado", label: "Reembolsado", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
];

function formatPaymentMethod(method: string | null) {
  if (method === "pix") return "Pix";
  if (method === "cartao") return "Cartão";
  return "—";
}

interface Registration {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  ticket_batch: string;
  ticket_type: string;
  ticket_price_cents: number;
  class_time: string;
  payment_method: string | null;
  status: RegStatus;
  partner_full_name: string | null;
  partner_email: string | null;
  partner_phone: string | null;
  address: string;
  event_suggestions: string | null;
  parq_notes: string | null;
  parq_q1: boolean; parq_q2: boolean; parq_q3: boolean; parq_q4: boolean;
  parq_q5: boolean; parq_q6: boolean; parq_q7: boolean;
  partner_parq_q1: boolean | null; partner_parq_q2: boolean | null;
  partner_parq_q3: boolean | null; partner_parq_q4: boolean | null;
  partner_parq_q5: boolean | null; partner_parq_q6: boolean | null;
  partner_parq_q7: boolean | null;
  partner_parq_notes: string | null;
}

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [openRegId, setOpenRegId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) return;
      await Promise.all([loadLots(), loadRegs(), loadCoupons(), loadEvents()]);
    })();
  }, []);

  async function loadLots() {
    const { data, error } = await supabase.from("lots").select("*").order("sort_order");
    if (error) toast.error(error.message);
    else setLots((data as Lot[]) ?? []);
  }

  async function loadRegs() {
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRegs((data as Registration[]) ?? []);
  }

  async function loadCoupons() {
    const { data, error } = await supabase.from("coupons").select("*").order("code");
    if (error) toast.error(error.message);
    else setCoupons((data as Coupon[]) ?? []);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events" as never)
      .select("id, name, active")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setEventOptions((data as unknown as EventOption[]) ?? []);
  }

  async function toggleLot(lot: Lot) {
    const { error } = await supabase.from("lots").update({ active: !lot.active }).eq("id", lot.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${lot.label} ${!lot.active ? "ativado" : "desativado"}`);
      loadLots();
    }
  }

  async function saveLot(id: string, patch: Partial<Lot>) {
    const { error } = await supabase.from("lots").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Evento atualizado");
    await loadLots();
    return true;
  }

  async function updateStatus(reg: Registration, status: RegStatus) {
    const prev = reg.status;
    setRegs((rs) => rs.map((r) => (r.id === reg.id ? { ...r, status } : r)));
    const { error } = await supabase
      .from("registrations")
      .update({ status } as never)
      .eq("id", reg.id);
    if (error) {
      setRegs((rs) => rs.map((r) => (r.id === reg.id ? { ...r, status: prev } : r)));
      toast.error(error.message);
    } else {
      toast.success(`Status atualizado: ${STATUS_OPTIONS.find((o) => o.value === status)?.label}`);
    }
  }

  async function deleteReg(reg: Registration) {
    if (!confirm(`Excluir a inscrição de ${reg.full_name}? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("registrations").delete().eq("id", reg.id);
    if (error) return toast.error(error.message);
    setRegs((rs) => rs.filter((r) => r.id !== reg.id));
    if (openRegId === reg.id) setOpenRegId(null);
    toast.success("Inscrição excluída");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function buildExportRows() {
    const yn = (v: boolean | null) => (v === null ? "" : v ? "SIM" : "não");
    return regs.map((r) => ({
      "Data": new Date(r.created_at).toLocaleString("pt-BR"),
      "Status": STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status,
      "Nome": r.full_name,
      "CPF": r.cpf,
      "E-mail": r.email,
      "Telefone": r.phone,
      "Endereço": r.address,
      "Evento": r.ticket_batch,
      "Tipo": r.ticket_type,
      "Valor (R$)": (r.ticket_price_cents / 100).toFixed(2).replace(".", ","),
      "Forma de pagamento": r.payment_method === "pix" ? "Pix" : r.payment_method === "cartao" ? "Cartão" : r.payment_method ?? "—",
      "Aula": r.class_time,
      "PARQ 1 - Coração/supervisão": yn(r.parq_q1),
      "PARQ 2 - Dor peito (ativ.)": yn(r.parq_q2),
      "PARQ 3 - Dor peito (repouso)": yn(r.parq_q3),
      "PARQ 4 - Tontura/desequilíbrio": yn(r.parq_q4),
      "PARQ 5 - Problema ósseo/articular": yn(r.parq_q5),
      "PARQ 6 - Medicamento coração/pressão": yn(r.parq_q6),
      "PARQ 7 - Outra razão": yn(r.parq_q7),
      "PARQ Observações": r.parq_notes ?? "",
      "Dupla - Nome": r.partner_full_name ?? "",
      "Dupla - CPF": (r as unknown as { partner_cpf?: string }).partner_cpf ?? "",
      "Dupla - E-mail": r.partner_email ?? "",
      "Dupla - Telefone": r.partner_phone ?? "",
      "Dupla PARQ 1": yn(r.partner_parq_q1),
      "Dupla PARQ 2": yn(r.partner_parq_q2),
      "Dupla PARQ 3": yn(r.partner_parq_q3),
      "Dupla PARQ 4": yn(r.partner_parq_q4),
      "Dupla PARQ 5": yn(r.partner_parq_q5),
      "Dupla PARQ 6": yn(r.partner_parq_q6),
      "Dupla PARQ 7": yn(r.partner_parq_q7),
      "Dupla PARQ Observações": r.partner_parq_notes ?? "",
      "Sugestões de próximos eventos": r.event_suggestions ?? "",
    }));
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows = buildExportRows();
    if (rows.length === 0) return toast.error("Nenhuma inscrição para exportar");
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    // BOM para Excel reconhecer UTF-8
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `inscricoes-whf-${stamp()}.csv`);
    toast.success("CSV exportado");
  }

  function exportXLSX() {
    const rows = buildExportRows();
    if (rows.length === 0) return toast.error("Nenhuma inscrição para exportar");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inscrições");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    downloadBlob(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `inscricoes-whf-${stamp()}.xlsx`,
    );
    toast.success("Excel exportado");
  }

  function stamp() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }


  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl text-primary">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não tem permissão de admin. Peça a um administrador para conceder acesso.
          </p>
          <button onClick={signOut} className="mt-6 rounded-full border border-border px-6 py-2 text-xs uppercase tracking-widest">
            Sair
          </button>
        </div>
      </div>
    );
  }

  const openReg = regs.find((r) => r.id === openRegId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-primary">Admin · WHF</h1>
        <div className="flex items-center gap-5">
        <Link to="/eventos" search={{ create: true }} className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs uppercase tracking-widest hover:opacity-90">
          + Novo evento
        </Link>
        <Link to="/eventos" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          Eventos
        </Link>
        <button onClick={signOut} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          Sair
        </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        {/* Financeiro */}
        <FinancePanel regs={regs} />

        {/* Lots */}
        <section>
          <h2 className="font-display text-xl mb-4">Eventos</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {lots.map((lot) => {
              const sold = regs
                .filter((r) => r.ticket_batch === lot.label && r.status === "confirmado")
                .reduce((sum, r) => sum + (r.ticket_type === "dupla" ? 2 : 1), 0);
              return (
                <LotEditor
                  key={lot.id}
                  lot={lot}
                  sold={sold}
                  onToggle={() => toggleLot(lot)}
                  onSave={(patch) => saveLot(lot.id, patch)}
                />
              );
            })}
          </div>
        </section>

        {/* Coupons */}
        <CouponsPanel coupons={coupons} events={eventOptions} onReload={loadCoupons} />



        {/* Classes occupancy */}
        <section>
          <h2 className="font-display text-xl mb-4">Aulas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CLASS_TIMES.map((t) => {
              const active = regs.filter((r) => r.class_time === t && r.status !== "cancelado");
              const seats = active.reduce((sum, r) => sum + (r.ticket_type === "dupla" ? 2 : 1), 0);
              const confirmed = active
                .filter((r) => r.status === "confirmado")
                .reduce((sum, r) => sum + (r.ticket_type === "dupla" ? 2 : 1), 0);
              const pending = seats - confirmed;
              const pct = Math.min(100, Math.round((seats / CLASS_CAPACITY) * 100));
              const full = seats >= CLASS_CAPACITY;
              return (
                <div key={t} className="rounded-lg border border-border p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-2xl">{t}</p>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${full ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                      {full ? "Lotada" : `${CLASS_CAPACITY - seats} vagas`}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">{seats}</span>
                    <span className="text-muted-foreground">/{CLASS_CAPACITY} participantes</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {confirmed} confirmadas · {pending} pendentes
                  </p>
                  <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full ${full ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Registrations */}
        <section>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-display text-xl">Inscrições ({regs.length})</h2>
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-secondary">
                Exportar CSV
              </button>
              <button onClick={exportXLSX} className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs uppercase tracking-widest hover:opacity-90">
                Exportar Excel
              </button>
              <button onClick={loadRegs} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
                Atualizar
              </button>
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
                  <th className="text-left px-3 py-2">Evento</th>
                  <th className="text-left px-3 py-2">Tipo</th>
                  <th className="text-left px-3 py-2">Aula</th>
                  <th className="text-left px-3 py-2">Pagamento</th>
                  <th className="text-left px-3 py-2">Dupla</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === r.status) ?? STATUS_OPTIONS[0];
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2">
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r, e.target.value as RegStatus)}
                          className={`text-xs uppercase tracking-widest rounded-full border px-2 py-1 font-semibold outline-none focus:ring-2 focus:ring-accent/40 ${opt.className}`}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">{r.full_name}</td>
                      <td className="px-3 py-2 text-xs">
                        <div>{r.email}</div>
                        <div className="text-muted-foreground">{r.phone}</div>
                      </td>
                      <td className="px-3 py-2">{r.ticket_batch}</td>
                      <td className="px-3 py-2">{r.ticket_type}</td>
                      <td className="px-3 py-2">{r.class_time}</td>
                      <td className="px-3 py-2">{formatPaymentMethod(r.payment_method)}</td>
                      <td className="px-3 py-2 text-xs">{r.partner_full_name ?? "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-3 justify-end">
                          <button onClick={() => setOpenRegId(r.id)} className="text-xs uppercase tracking-widest text-primary hover:underline">
                            Ver
                          </button>
                          <button
                            onClick={() => deleteReg(r)}
                            className="text-xs uppercase tracking-widest text-destructive hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {regs.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">Nenhuma inscrição ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {openReg && <RegistrationDetail reg={openReg} onClose={() => setOpenRegId(null)} />}
    </div>
  );
}

function FinancePanel({ regs }: { regs: Registration[] }) {
  const confirmed = regs.filter((r) => r.status === "confirmado");
  const individual = confirmed.filter((r) => r.ticket_type === "individual");
  const dupla = confirmed.filter((r) => r.ticket_type === "dupla");

  // Dupla: ticket_price_cents é por pessoa; o valor arrecadado é a soma dos dois ingressos.
  const regTotal = (r: Registration) => r.ticket_price_cents * (r.ticket_type === "dupla" ? 2 : 1);

  const totalIndividual = individual.reduce((s, r) => s + regTotal(r), 0);
  const totalDupla = dupla.reduce((s, r) => s + regTotal(r), 0);
  const total = totalIndividual + totalDupla;

  const pixTotal = confirmed.filter((r) => r.payment_method === "pix").reduce((s, r) => s + regTotal(r), 0);
  const cardTotal = confirmed.filter((r) => r.payment_method === "cartao").reduce((s, r) => s + regTotal(r), 0);

  const participants = confirmed.reduce((s, r) => s + (r.ticket_type === "dupla" ? 2 : 1), 0);


  return (
    <section>
      <h2 className="font-display text-xl mb-4">Financeiro</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-5 bg-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total arrecadado</p>
          <p className="font-display text-3xl text-primary mt-1">{formatCents(total)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {confirmed.length} inscrições confirmadas · {participants} participantes
          </p>
        </div>
        <div className="rounded-lg border border-border p-5 bg-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Individual</p>
          <p className="font-display text-2xl mt-1">{formatCents(totalIndividual)}</p>
          <p className="text-xs text-muted-foreground mt-2">{individual.length} ingresso(s)</p>
        </div>
        <div className="rounded-lg border border-border p-5 bg-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dupla</p>
          <p className="font-display text-2xl mt-1">{formatCents(totalDupla)}</p>
          <p className="text-xs text-muted-foreground mt-2">{dupla.length} ingresso(s) · {dupla.length * 2} participantes</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Pix</p>
          <p className="font-display text-xl mt-1">{formatCents(pixTotal)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Cartão</p>
          <p className="font-display text-xl mt-1">{formatCents(cardTotal)}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Ticket médio</p>
          <p className="font-display text-xl mt-1">
            {participants > 0 ? formatCents(Math.round(total / participants)) : formatCents(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">por participante</p>

        </div>
      </div>
    </section>
  );
}

function RegistrationDetail({ reg, onClose }: { reg: Registration; onClose: () => void }) {
  const parqLabels = ["Coração/supervisão", "Dor no peito (ativ.)", "Dor no peito (repouso)", "Tontura/desequilíbrio", "Problema ósseo/articular", "Medicamento coração/pressão", "Outra razão"];
  const parq = [reg.parq_q1, reg.parq_q2, reg.parq_q3, reg.parq_q4, reg.parq_q5, reg.parq_q6, reg.parq_q7];
  const partnerParq = [reg.partner_parq_q1, reg.partner_parq_q2, reg.partner_parq_q3, reg.partner_parq_q4, reg.partner_parq_q5, reg.partner_parq_q6, reg.partner_parq_q7];
  const hasPartner = !!reg.partner_full_name;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-background rounded-lg border border-accent/40 p-6">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl">{reg.full_name}</h3>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {reg.ticket_batch} · {reg.ticket_type} · {formatCents(reg.ticket_price_cents)} · {formatPaymentMethod(reg.payment_method)} · aula {reg.class_time}
        </p>

        <Block title="Contato">
          <p>{reg.email} · {reg.phone}</p>
          <p className="text-muted-foreground">CPF: {reg.cpf}</p>
          <p className="text-muted-foreground">{reg.address}</p>
        </Block>

        <Block title="PAR-Q">
          <ul className="space-y-1">
            {parqLabels.map((l, i) => (
              <li key={i} className="flex justify-between">
                <span>{l}</span>
                <span className={parq[i] ? "text-destructive font-semibold" : "text-muted-foreground"}>{parq[i] ? "SIM" : "não"}</span>
              </li>
            ))}
          </ul>
          {reg.parq_notes && <p className="mt-2 text-muted-foreground italic">"{reg.parq_notes}"</p>}
        </Block>

        {hasPartner && (
          <>
            <Block title="Dupla">
              <p>{reg.partner_full_name}</p>
              <p className="text-muted-foreground">{reg.partner_email} · {reg.partner_phone}</p>
            </Block>
            <Block title="PAR-Q da dupla">
              <ul className="space-y-1">
                {parqLabels.map((l, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{l}</span>
                    <span className={partnerParq[i] ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {partnerParq[i] === null ? "—" : partnerParq[i] ? "SIM" : "não"}
                    </span>
                  </li>
                ))}
              </ul>
              {reg.partner_parq_notes && <p className="mt-2 text-muted-foreground italic">"{reg.partner_parq_notes}"</p>}
            </Block>
          </>
        )}

        {reg.event_suggestions && (
          <Block title="Sugestões">
            <p className="italic">"{reg.event_suggestions}"</p>
          </Block>
        )}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 text-sm">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      {children}
    </div>
  );
}

function LotEditor({
  lot,
  sold,
  onToggle,
  onSave,
}: {
  lot: Lot;
  sold: number;
  onToggle: () => void;
  onSave: (patch: Partial<Lot>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(lot.label);
  const [total, setTotal] = useState(lot.total);
  const [capacity, setCapacity] = useState(lot.capacity);
  const [individual, setIndividual] = useState((lot.individual_price_cents / 100).toFixed(2));
  const [dupla, setDupla] = useState((lot.dupla_price_cents / 100).toFixed(2));
  const [sortOrder, setSortOrder] = useState(lot.sort_order);
  const [cardIndiv, setCardIndiv] = useState(lot.card_url_individual ?? "");
  const [cardDupla, setCardDupla] = useState(lot.card_url_dupla ?? "");
  const [pixIndiv, setPixIndiv] = useState(lot.pix_qr_individual_url ?? "");
  const [pixDuplaUrl, setPixDuplaUrl] = useState(lot.pix_qr_dupla_url ?? "");
  const [saving, setSaving] = useState(false);

  function reset() {
    setLabel(lot.label);
    setTotal(lot.total);
    setCapacity(lot.capacity);
    setIndividual((lot.individual_price_cents / 100).toFixed(2));
    setDupla((lot.dupla_price_cents / 100).toFixed(2));
    setSortOrder(lot.sort_order);
    setCardIndiv(lot.card_url_individual ?? "");
    setCardDupla(lot.card_url_dupla ?? "");
    setPixIndiv(lot.pix_qr_individual_url ?? "");
    setPixDuplaUrl(lot.pix_qr_dupla_url ?? "");
  }

  async function handleSave() {
    const ind = Math.round(parseFloat(individual.replace(",", ".")) * 100);
    const dup = Math.round(parseFloat(dupla.replace(",", ".")) * 100);
    if (!label.trim() || !Number.isFinite(total) || total < 0 || !Number.isFinite(ind) || !Number.isFinite(dup)) {
      toast.error("Preencha os campos corretamente");
      return;
    }
    setSaving(true);
    const ok = await onSave({
      label: label.trim(),
      total,
      capacity,
      individual_price_cents: ind,
      dupla_price_cents: dup,
      sort_order: sortOrder,
      card_url_individual: cardIndiv.trim() || null,
      card_url_dupla: cardDupla.trim() || null,
      pix_qr_individual_url: pixIndiv.trim() || null,
      pix_qr_dupla_url: pixDuplaUrl.trim() || null,
    });
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-border p-5 bg-card">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">{lot.label}</p>
          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${lot.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {lot.active ? "Ativo" : "Inativo"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {sold}/{lot.capacity} confirmadas · {formatCents(lot.individual_price_cents)} indiv. · {formatCents(lot.dupla_price_cents)} dupla
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Ordem: {lot.sort_order}</p>
        <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          <p>💳 Individual: {lot.card_url_individual ? <span className="text-foreground">✓</span> : <span className="text-destructive">faltando</span>}</p>
          <p>💳 Dupla: {lot.card_url_dupla ? <span className="text-foreground">✓</span> : <span className="text-destructive">faltando</span>}</p>
          <p>📱 QR Indiv.: {lot.pix_qr_individual_url ? <span className="text-foreground">✓</span> : <span className="text-destructive">faltando</span>}</p>
          <p>📱 QR Dupla: {lot.pix_qr_dupla_url ? <span className="text-foreground">✓</span> : <span className="text-destructive">faltando</span>}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onToggle}
            className="flex-1 rounded-full border border-border py-2 text-xs uppercase tracking-widest hover:bg-secondary"
          >
            {lot.active ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={() => { reset(); setEditing(true); }}
            className="flex-1 rounded-full bg-primary text-primary-foreground py-2 text-xs uppercase tracking-widest hover:opacity-90"
          >
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-5 bg-card space-y-3">
      <label className="block text-xs uppercase tracking-widest text-muted-foreground">
        Nome
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs uppercase tracking-widest text-muted-foreground">
          Vagas totais
          <input
            type="number"
            min={0}
            value={total}
            onChange={(e) => setTotal(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground">
          Limite de inscrições
          <input
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground">
          Ordem
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs uppercase tracking-widest text-muted-foreground">
          Individual (R$)
          <input
            inputMode="decimal"
            value={individual}
            onChange={(e) => setIndividual(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-muted-foreground">
          Dupla p/ pessoa (R$)
          <input
            inputMode="decimal"
            value={dupla}
            onChange={(e) => setDupla(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="pt-3 border-t border-border space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Link de cartão (InfinityPay)</p>
        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
          Individual
          <input value={cardIndiv} onChange={(e) => setCardIndiv(e.target.value)} placeholder="https://link.infinitepay.io/..." className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal" />
        </label>
        <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
          Dupla
          <input value={cardDupla} onChange={(e) => setCardDupla(e.target.value)} placeholder="https://link.infinitepay.io/..." className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal" />
        </label>
      </div>

      <div className="pt-3 border-t border-border space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">QR Code Pix</p>
        <QrField label="Individual" value={pixIndiv} onChange={setPixIndiv} folder={`lots/${lot.id}/individual`} />
        <QrField label="Dupla" value={pixDuplaUrl} onChange={setPixDuplaUrl} folder={`lots/${lot.id}/dupla`} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="flex-1 rounded-full border border-border py-2 text-xs uppercase tracking-widest hover:bg-secondary disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-full bg-primary text-primary-foreground py-2 text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Shared QR upload field ---------------- */

async function uploadQr(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("payment-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    toast.error(`Falha no upload: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from("payment-assets").getPublicUrl(path);
  return data.publicUrl;
}

function QrField({ label, value, onChange, folder }: { label: string; value: string; onChange: (v: string) => void; folder: string }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex gap-3 items-start">
        {value ? (
          <img src={value} alt={`QR ${label}`} className="w-20 h-20 rounded-md border border-border bg-white object-contain" />
        ) : (
          <div className="w-20 h-20 rounded-md border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">Sem QR</div>
        )}
        <div className="flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL do QR Code"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs normal-case tracking-normal"
          />
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer text-center rounded-md border border-border py-1.5 text-[10px] uppercase tracking-widest hover:bg-secondary">
              {uploading ? "Enviando…" : "Enviar imagem"}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  const url = await uploadQr(f, folder);
                  setUploading(false);
                  if (url) { onChange(url); toast.success("Imagem enviada"); }
                  e.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest hover:bg-secondary"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Coupons panel ---------------- */

const EMPTY_COUPON: Omit<Coupon, "id"> = {
  code: "",
  description: "",
  individual_price_cents: null,
  dupla_price_cents: null,
  card_url_individual: null,
  card_url_dupla: null,
  pix_qr_individual_url: null,
  pix_qr_dupla_url: null,
  auto_confirm: false,
  valid_for: "both",
  active: true,
  event_ids: [],
};

function CouponsPanel({ coupons, events, onReload }: { coupons: Coupon[]; events: EventOption[]; onReload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Coupon | Omit<Coupon, "id"> | null>(null);
  const isNew = editing !== null && !("id" in editing);

  async function save(c: Coupon | Omit<Coupon, "id">) {
    const payload = {
      ...c,
      event_ids: c.event_ids ?? [],
      code: c.code.trim().toUpperCase(),
      description: c.description?.trim() || null,
      card_url_individual: c.card_url_individual?.trim() || null,
      card_url_dupla: c.card_url_dupla?.trim() || null,
      pix_qr_individual_url: c.pix_qr_individual_url?.trim() || null,
      pix_qr_dupla_url: c.pix_qr_dupla_url?.trim() || null,
    };
    if (!payload.code) { toast.error("Informe o código"); return; }
    if ("id" in c) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", c.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Cupom atualizado");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Cupom criado");
    }
    setEditing(null);
    await onReload();
  }

  async function toggleActive(c: Coupon) {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    await onReload();
  }

  async function remove(c: Coupon) {
    if (!confirm(`Excluir cupom ${c.code}?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Cupom excluído");
    await onReload();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Cupons</h2>
        <button
          onClick={() => setEditing({ ...EMPTY_COUPON })}
          className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs uppercase tracking-widest hover:opacity-90"
        >
          + Novo cupom
        </button>
      </div>

      {coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{c.code}</p>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${c.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {c.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p>Válido para: <span className="text-foreground">{c.valid_for === "both" ? "Individual e Dupla" : c.valid_for === "individual" ? "Individual" : "Dupla"}</span></p>
                <p>Individual: <span className="text-foreground">{c.individual_price_cents !== null ? formatCents(c.individual_price_cents) : "usa preço do evento"}</span></p>
                <p>Dupla p/ pessoa: <span className="text-foreground">{c.dupla_price_cents !== null ? formatCents(c.dupla_price_cents) : "usa preço do evento"}</span></p>
                <p>Confirmação automática: <span className="text-foreground">{c.auto_confirm ? "sim" : "não"}</span></p>
                <p>Eventos: <span className="text-foreground">{!c.event_ids || c.event_ids.length === 0 ? "todos os eventos" : c.event_ids.map((id) => events.find((e) => e.id === id)?.name ?? "—").join(", ")}</span></p>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => toggleActive(c)} className="flex-1 rounded-full border border-border py-2 text-[10px] uppercase tracking-widest hover:bg-secondary">
                  {c.active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => setEditing(c)} className="flex-1 rounded-full bg-primary text-primary-foreground py-2 text-[10px] uppercase tracking-widest hover:opacity-90">
                  Editar
                </button>
                <button onClick={() => remove(c)} className="rounded-full border border-destructive text-destructive py-2 px-3 text-[10px] uppercase tracking-widest hover:bg-destructive hover:text-destructive-foreground">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CouponEditor
          coupon={editing}
          events={events}
          isNew={isNew}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </section>
  );
}

function CouponEditor({
  coupon,
  events,
  isNew,
  onCancel,
  onSave,
}: {
  coupon: Coupon | Omit<Coupon, "id">;
  events: EventOption[];
  isNew: boolean;
  onCancel: () => void;
  onSave: (c: Coupon | Omit<Coupon, "id">) => Promise<void>;
}) {
  const [form, setForm] = useState(coupon);
  const [saving, setSaving] = useState(false);
  const folderKey = "id" in form ? form.id : `new-${Date.now()}`;

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function priceInput(value: number | null): string {
    return value === null ? "" : (value / 100).toFixed(2);
  }

  function parsePrice(v: string): number | null {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = parseFloat(trimmed.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-background rounded-lg border border-accent/40 p-6 my-4 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-2xl">{isNew ? "Novo cupom" : `Editar ${form.code}`}</h3>
          <button onClick={onCancel} className="text-2xl leading-none">×</button>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Eventos em que o cupom vale</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Nenhum selecionado = vale para todos os eventos.
          </p>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum evento cadastrado.</p>
            ) : (
              events.map((ev) => {
                const selected = (form.event_ids ?? []).includes(ev.id);
                return (
                  <label key={ev.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = form.event_ids ?? [];
                        set("event_ids", e.target.checked ? [...current, ev.id] : current.filter((id) => id !== ev.id));
                      }}
                    />
                    <span>{ev.name}</span>
                    {ev.active && (
                      <span className="text-[10px] uppercase tracking-widest text-accent">no ar</span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground">
            Código
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="EX: WHFVIP"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal uppercase"
            />
          </label>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground">
            Válido para
            <select
              value={form.valid_for}
              onChange={(e) => set("valid_for", e.target.value as Coupon["valid_for"])}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
            >
              <option value="both">Individual e Dupla</option>
              <option value="individual">Somente Individual</option>
              <option value="dupla">Somente Dupla</option>
            </select>
          </label>
        </div>

        <label className="block text-xs uppercase tracking-widest text-muted-foreground">
          Descrição (opcional)
          <input
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
          />
        </label>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="block text-xs uppercase tracking-widest text-muted-foreground">
            Preço Individual (R$)
            <input
              inputMode="decimal"
              value={priceInput(form.individual_price_cents)}
              onChange={(e) => set("individual_price_cents", parsePrice(e.target.value))}
              placeholder="deixe vazio p/ usar preço do lote"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
            />
          </label>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground">
            Preço Dupla p/ pessoa (R$)
            <input
              inputMode="decimal"
              value={priceInput(form.dupla_price_cents)}
              onChange={(e) => set("dupla_price_cents", parsePrice(e.target.value))}
              placeholder="deixe vazio p/ usar preço do lote"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
            />
          </label>
        </div>

        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Link de cartão (opcional — sobrescreve o do evento)</p>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            Individual
            <input
              value={form.card_url_individual ?? ""}
              onChange={(e) => set("card_url_individual", e.target.value || null)}
              placeholder="https://link.infinitepay.io/..."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
            />
          </label>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            Dupla
            <input
              value={form.card_url_dupla ?? ""}
              onChange={(e) => set("card_url_dupla", e.target.value || null)}
              placeholder="https://link.infinitepay.io/..."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal"
            />
          </label>
        </div>

        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">QR Code Pix (opcional — sobrescreve o do evento)</p>
          <QrField
            label="Individual"
            value={form.pix_qr_individual_url ?? ""}
            onChange={(v) => set("pix_qr_individual_url", v || null)}
            folder={`coupons/${folderKey}/individual`}
          />
          <QrField
            label="Dupla"
            value={form.pix_qr_dupla_url ?? ""}
            onChange={(v) => set("pix_qr_dupla_url", v || null)}
            folder={`coupons/${folderKey}/dupla`}
          />
        </div>

        <div className="pt-3 border-t border-border grid md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.auto_confirm}
              onChange={(e) => set("auto_confirm", e.target.checked)}
            />
            Confirmar inscrição automaticamente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Cupom ativo
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-full border border-border py-2 text-xs uppercase tracking-widest hover:bg-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-full bg-primary text-primary-foreground py-2 text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
