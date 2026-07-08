import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  individual_price_cents: number;
  dupla_price_cents: number;
  active: boolean;
  sort_order: number;
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
  const [openRegId, setOpenRegId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) return;
      await Promise.all([loadLots(), loadRegs()]);
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
    toast.success("Lote atualizado");
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
      "Lote": r.ticket_batch,
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
        <button onClick={signOut} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        {/* Lots */}
        <section>
          <h2 className="font-display text-xl mb-4">Lotes</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {lots.map((lot) => {
              const sold = regs
                .filter((r) => r.ticket_batch === lot.label && r.status !== "cancelado")
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
                  <th className="text-left px-3 py-2">Lote</th>
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
