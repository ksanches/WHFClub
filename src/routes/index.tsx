import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CLASS_TIMES,
  CLASS_CAPACITY,
  paymentUrlFor,
  formatBRL,
  formatCents,
  maskCPF,
  isValidCPF,
  maskPhone,
  isValidMobileBR,
  PARQ_QUESTIONS,
  PIX_INFO,
  type Lot,
  type TicketType,
  type PaymentMethod,
} from "@/lib/whf";


export const Route = createFileRoute("/")({
  component: LandingPage,
});

interface DbLot {
  id: string;
  label: string;
  total: number;
  individual_price_cents: number;
  dupla_price_cents: number;
  active: boolean;
  sort_order: number;
}

interface Selection {
  lot: Lot;
  type: TicketType;
}

function LandingPage() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState<Record<string, number>>({});

  async function loadOccupancy() {
    const { data } = await supabase.rpc("get_class_occupancy");
    const map: Record<string, number> = {};
    ((data as { class_time: string; participants: number }[] | null) ?? []).forEach((r) => {
      map[r.class_time] = r.participants;
    });
    setOccupancy(map);
  }

  useEffect(() => {
    supabase
      .from("lots")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        const rows = (data as DbLot[] | null) ?? [];
        setLots(
          rows.map((r) => ({
            id: r.id,
            label: r.label,
            total: r.total,
            individual: r.individual_price_cents / 100,
            dupla: r.dupla_price_cents / 100,
            active: r.active,
            sort_order: r.sort_order,
          })),
        );
        setLoading(false);
      });
    loadOccupancy();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
      <Hero onPickLot={() => document.getElementById("lotes")?.scrollIntoView({ behavior: "smooth" })} />
      <Manifesto />
      <EventInfo />
      <Lots lots={lots} loading={loading} onSelect={(lot, type) => setSelection({ lot, type })} />
      <Footer />

      {selection && (
        <RegistrationDialog
          selection={selection}
          occupancy={occupancy}
          onClose={() => setSelection(null)}
          onSubmitted={loadOccupancy}
        />
      )}
    </div>
  );
}

function Hero({ onPickLot }: { onPickLot: () => void }) {
  return (
    <header className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle at 20% 10%, var(--gold) 0, transparent 40%), radial-gradient(circle at 80% 90%, var(--gold) 0, transparent 40%)",
      }} />
      <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <div className="mx-auto mb-8 wax-seal">WHF</div>
        <p className="italic-serif text-accent tracking-widest text-xs md:text-sm uppercase">Save the date · 24.07</p>
        <h1 className="mt-4 font-display text-5xl md:text-7xl leading-none">WANNA<br />HAVE FUN.</h1>
        <p className="italic-serif mt-6 text-lg md:text-2xl text-accent">"Treinar é o plano. Se divertir é a regra."</p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onPickLot} className="rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-primary hover:opacity-90 transition">
            Garantir meu ingresso
          </button>
          <a href="#info" className="rounded-full border border-accent/60 px-8 py-3 text-sm uppercase tracking-widest text-accent hover:bg-accent/10 transition">
            Sobre o evento
          </a>
        </div>
        <p className="mt-10 text-xs uppercase tracking-[0.3em] text-accent/80">You Smile Fight · São Paulo</p>
      </div>
    </header>
  );
}

function Manifesto() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="italic-serif text-2xl md:text-3xl leading-snug text-foreground">
        Aqui ninguém precisa se provar pra pertencer.<br />
        A atividade é o pretexto. A força coletiva é o produto.
      </p>
      <div className="mt-8 mx-auto h-px w-24 bg-accent/60" />
    </section>
  );
}

function EventInfo() {
  return (
    <section id="info" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-8 px-6 py-16">
        <InfoBlock label="Data" value="24 de Julho" />
        <InfoBlock label="Aulas" value="11h ou 12h" />
        <InfoBlock label="Local" value="You Smile Fight" href="https://www.instagram.com/yousmilefight?igsh=MWR4Njl3NWJ6MXBhZg==" />
      </div>
    </section>
  );
}

function InfoBlock({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-accent">{label}</p>
      <p className="mt-3 font-display text-3xl md:text-4xl">{value}</p>
    </>
  );
  return (
    <div className="text-center">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-90">
          {content}
          <span className="mt-2 inline-block text-[10px] uppercase tracking-widest text-accent/80">@yousmilefight ↗</span>
        </a>
      ) : content}
    </div>
  );
}

function Lots({ lots, loading, onSelect }: { lots: Lot[]; loading: boolean; onSelect: (lot: Lot, type: TicketType) => void }) {
  const active = lots.filter((l) => l.active);
  return (
    <section id="lotes" className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center mb-14">
        <p className="italic-serif text-accent uppercase tracking-widest text-xs">Ingressos</p>
        <h2 className="mt-2 font-display text-4xl md:text-5xl">Escolha seu lote</h2>
        <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
          Individual ou em dupla — venha com uma amiga e pague menos. Vagas limitadas.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Carregando lotes…</p>
      ) : active.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhum lote disponível no momento.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {active.map((lot) => <LotCard key={lot.id} lot={lot} onSelect={onSelect} />)}
        </div>
      )}
    </section>
  );
}

function LotCard({ lot, onSelect }: { lot: Lot; onSelect: (lot: Lot, type: TicketType) => void }) {
  return (
    <article className="relative rounded-lg border border-accent/30 bg-card p-8 shadow-sm hover:shadow-md transition">
      <div className="absolute -top-3 left-6 bg-primary text-primary-foreground px-3 py-1 text-[10px] uppercase tracking-widest">{lot.label}</div>
      
      <div className="mt-6 space-y-4">
        <PriceRow title="Individual" price={formatBRL(lot.individual)} onClick={() => onSelect(lot, "individual")} />
        <PriceRow title="Dupla" subtitle="cada" price={formatBRL(lot.dupla)} highlight onClick={() => onSelect(lot, "dupla")} />
      </div>
    </article>
  );
}

function PriceRow({ title, subtitle, price, highlight, onClick }: { title: string; subtitle?: string; price: string; highlight?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-md border p-4 flex items-center justify-between transition ${highlight ? "border-accent bg-accent/10 hover:bg-accent/20" : "border-border hover:border-accent"}`}>
      <div>
        <p className="font-display text-lg">{title}</p>
        {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="text-right">
        <p className="font-display text-2xl text-primary">{price}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">inscrever →</p>
      </div>
    </button>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground/80 py-10 text-center">
      <p className="italic-serif text-accent text-sm">"Mulher com tribo chega mais longe."</p>
      <p className="mt-4 text-xs uppercase tracking-widest">WHF · São Paulo</p>
      <p className="mt-4"><Link to="/auth" className="text-[10px] uppercase tracking-widest text-primary-foreground/50 hover:text-accent">Admin</Link></p>
    </footer>
  );
}

/* ---------------- REGISTRATION ---------------- */

interface FormState {
  fullName: string;
  cpf: string;
  address: string;
  phone: string;
  email: string;
  acceptMessages: boolean;
  classTime: string;
  partnerFullName: string;
  partnerCpf: string;
  partnerEmail: string;
  partnerPhone: string;
  parq: (boolean | null)[];
  parqNotes: string;
  partnerParq: (boolean | null)[];
  partnerParqNotes: string;
  suggestions: string;
}

const initialForm: FormState = {
  fullName: "", cpf: "", address: "", phone: "", email: "",
  acceptMessages: false, classTime: "",
  partnerFullName: "", partnerCpf: "", partnerEmail: "", partnerPhone: "",
  parq: Array(7).fill(null), parqNotes: "",
  partnerParq: Array(7).fill(null), partnerParqNotes: "",
  suggestions: "",
};

function RegistrationDialog({ selection, occupancy, onClose, onSubmitted }: { selection: Selection; occupancy: Record<string, number>; onClose: () => void; onSubmitted: () => void }) {
  const { lot, type } = selection;
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [pixConfirmation, setPixConfirmation] = useState(false);
  const [cardConfirmation, setCardConfirmation] = useState(false);

  const paymentUrl = useMemo(() => paymentUrlFor(lot.id, type), [lot, type]);
  const price = type === "individual" ? lot.individual : lot.dupla;
  const isDupla = type === "dupla";
  const totalPrice = isDupla ? price * 2 : price;
  const seatsNeeded = isDupla ? 2 : 1;
  const availableTimes = CLASS_TIMES.filter((t) => (occupancy[t] ?? 0) + seatsNeeded <= CLASS_CAPACITY);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return toast.error("Informe seu nome completo.");
    if (!isValidCPF(form.cpf)) return toast.error("CPF inválido.");
    if (form.address.trim().length < 5) return toast.error("Informe seu endereço completo.");
    if (!isValidMobileBR(form.phone)) return toast.error("Telefone móvel inválido.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return toast.error("E-mail inválido.");
    if (!form.classTime) return toast.error("Escolha o horário da aula.");
    if ((occupancy[form.classTime] ?? 0) + seatsNeeded > CLASS_CAPACITY) {
      return toast.error("Este horário acabou de lotar. Escolha outro.");
    }
    if (form.parq.some((v) => v === null)) return toast.error("Responda todo o PAR-Q.");

    if (isDupla) {
      if (form.partnerFullName.trim().length < 2) return toast.error("Informe o nome da sua dupla.");
      if (!isValidCPF(form.partnerCpf)) return toast.error("CPF da dupla inválido.");
      if (form.partnerCpf.replace(/\D/g, "") === form.cpf.replace(/\D/g, ""))
        return toast.error("CPF da dupla deve ser diferente do seu.");
      if (!isValidMobileBR(form.partnerPhone)) return toast.error("Telefone da dupla inválido.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.partnerEmail)) return toast.error("E-mail da dupla inválido.");
      if (form.partnerEmail.trim().toLowerCase() === form.email.trim().toLowerCase())
        return toast.error("E-mail da dupla deve ser diferente do seu.");
      if (form.partnerParq.some((v) => v === null)) return toast.error("Responda todo o PAR-Q da dupla.");
    }

    setSubmitting(true);
    const { error } = await supabase.from("registrations").insert({
      full_name: form.fullName.trim(),
      cpf: form.cpf,
      email: form.email.trim(),
      phone: form.phone,
      address: form.address.trim(),
      accept_messages: form.acceptMessages,
      ticket_batch: lot.label,
      ticket_type: type,
      ticket_price_cents: Math.round(price * 100),
      class_time: form.classTime,
      partner_full_name: isDupla ? form.partnerFullName.trim() : null,
      partner_cpf: isDupla ? form.partnerCpf : null,
      partner_email: isDupla ? form.partnerEmail.trim() : null,
      partner_phone: isDupla ? form.partnerPhone : null,
      parq_q1: form.parq[0]!, parq_q2: form.parq[1]!, parq_q3: form.parq[2]!,
      parq_q4: form.parq[3]!, parq_q5: form.parq[4]!, parq_q6: form.parq[5]!, parq_q7: form.parq[6]!,
      parq_notes: form.parqNotes || null,
      partner_parq_q1: isDupla ? form.partnerParq[0] : null,
      partner_parq_q2: isDupla ? form.partnerParq[1] : null,
      partner_parq_q3: isDupla ? form.partnerParq[2] : null,
      partner_parq_q4: isDupla ? form.partnerParq[3] : null,
      partner_parq_q5: isDupla ? form.partnerParq[4] : null,
      partner_parq_q6: isDupla ? form.partnerParq[5] : null,
      partner_parq_q7: isDupla ? form.partnerParq[6] : null,
      partner_parq_notes: isDupla ? (form.partnerParqNotes || null) : null,
      event_suggestions: form.suggestions || null,
      payment_url: paymentMethod === "cartao" ? paymentUrl : "pix",
    });
    setSubmitting(false);

    if (error) {
      console.error(error);
      toast.error("Não foi possível salvar sua inscrição. Tente novamente.");
      return;
    }


    onSubmitted();

    if (paymentMethod === "cartao") {
      toast.success("Inscrição registrada! Finalize o pagamento.");
      setCardConfirmation(true);
    } else {
      toast.success("Inscrição registrada! Confira os dados do Pix.");
      setPixConfirmation(true);
    }
  }

  if (cardConfirmation) {
    return <CardScreen paymentUrl={paymentUrl} totalPrice={totalPrice} lotLabel={lot.label} typeLabel={isDupla ? "Dupla" : "Individual"} onClose={onClose} />;
  }

  if (pixConfirmation) {
    return <PixScreen totalPrice={totalPrice} lotLabel={lot.label} typeLabel={isDupla ? "Dupla" : "Individual"} onClose={onClose} />;
  }


  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-2xl bg-background rounded-lg shadow-xl border border-accent/40">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-border bg-background/95 backdrop-blur px-6 py-4 rounded-t-lg z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {lot.label} · {type === "individual" ? "Individual" : "Dupla"} · {formatBRL(price)}{isDupla && " por pessoa"}
            </p>
            <h3 className="font-display text-2xl">Inscrição</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
          <Section title="Seus dados">
            <Field label="Nome completo">
              <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputCls} />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="CPF">
                <input required inputMode="numeric" value={form.cpf} onChange={(e) => update("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
              </Field>
              <Field label="Telefone (celular)">
                <input required inputMode="tel" value={form.phone} onChange={(e) => update("phone", maskPhone(e.target.value))} placeholder="(11) 91234-5678" className={inputCls} />
              </Field>
            </div>
            <Field label="E-mail">
              <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Endereço completo">
              <input required value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, bairro, cidade — SP" className={inputCls} />
            </Field>
            <Field label="Horário da aula">
              <div className="flex gap-3">
                {CLASS_TIMES.map((t) => (
                  <label key={t} className={`flex-1 cursor-pointer text-center rounded-md border p-3 transition ${form.classTime === t ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`}>
                    <input type="radio" name="classTime" value={t} checked={form.classTime === t} onChange={() => update("classTime", t)} className="sr-only" />
                    <span className="font-display text-lg">{t}</span>
                  </label>
                ))}
              </div>
            </Field>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={form.acceptMessages} onChange={(e) => update("acceptMessages", e.target.checked)} className="mt-1" />
              <span>Aceito receber mensagens da WHF sobre este evento e próximas edições.</span>
            </label>
          </Section>

          <ParqBlock title="Questionário PAR-Q" answers={form.parq} onChange={(a) => update("parq", a)} notes={form.parqNotes} onNotes={(v) => update("parqNotes", v)} />

          {isDupla && (
            <>
              <Section title="Dados da sua dupla">
                <p className="text-xs text-muted-foreground -mt-2">Você está inscrevendo as duas ao mesmo tempo. Preencha todos os dados dela.</p>
                <Field label="Nome completo">
                  <input required value={form.partnerFullName} onChange={(e) => update("partnerFullName", e.target.value)} className={inputCls} />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="CPF">
                    <input required inputMode="numeric" value={form.partnerCpf} onChange={(e) => update("partnerCpf", maskCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
                  </Field>
                  <Field label="Telefone (celular)">
                    <input required inputMode="tel" value={form.partnerPhone} onChange={(e) => update("partnerPhone", maskPhone(e.target.value))} placeholder="(11) 91234-5678" className={inputCls} />
                  </Field>
                </div>
                <Field label="E-mail">
                  <input required type="email" value={form.partnerEmail} onChange={(e) => update("partnerEmail", e.target.value)} className={inputCls} />
                </Field>
              </Section>

              <ParqBlock title="Questionário PAR-Q da dupla" answers={form.partnerParq} onChange={(a) => update("partnerParq", a)} notes={form.partnerParqNotes} onNotes={(v) => update("partnerParqNotes", v)} />
            </>
          )}

          <Section title="Próximos eventos">
            <Field label="Sugestões para próximas edições (opcional)">
              <textarea rows={3} value={form.suggestions} onChange={(e) => update("suggestions", e.target.value)} placeholder="Do que você gostaria de participar?" className={inputCls} />
            </Field>
          </Section>

          <Section title="Forma de pagamento">
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "cartao", label: "Cartão", hint: "InfinityPay" },
                { id: "pix", label: "Pix", hint: "Transferência" },
              ] as const).map((opt) => {
                const selected = paymentMethod === opt.id;
                return (
                  <label key={opt.id} className={`cursor-pointer text-center rounded-md border p-3 transition ${selected ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`}>
                    <input type="radio" name="paymentMethod" value={opt.id} checked={selected} onChange={() => setPaymentMethod(opt.id)} className="sr-only" />
                    <span className="block font-display text-lg">{opt.label}</span>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{opt.hint}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          <div className="pt-2 flex flex-col sm:flex-row-reverse gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold hover:opacity-90 disabled:opacity-60">
              {submitting
                ? "Enviando..."
                : paymentMethod === "cartao"
                  ? `Finalizar e pagar · ${formatCents(Math.round(price * 100))}${isDupla ? " (por pessoa)" : ""}`
                  : `Finalizar e ver dados do Pix · ${formatCents(Math.round(totalPrice * 100))}`}
            </button>
            <button type="button" onClick={onClose} className="rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest hover:bg-secondary">
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {paymentMethod === "cartao"
              ? "Ao finalizar, você será direcionada para o pagamento seguro via InfinityPay."
              : "Ao finalizar, exibiremos os dados do Pix para você concluir o pagamento."}
          </p>

        </form>
      </div>
    </div>
  );
}

function ParqBlock({ title, answers, onChange, notes, onNotes }: {
  title: string;
  answers: (boolean | null)[];
  onChange: (a: (boolean | null)[]) => void;
  notes: string;
  onNotes: (v: string) => void;
}) {
  return (
    <Section title={title}>
      <p className="text-xs text-muted-foreground -mt-2">
        Responda com sinceridade. Em caso de qualquer "Sim", recomendamos consultar um médico antes de participar.
      </p>
      <ol className="space-y-4 list-decimal pl-5">
        {PARQ_QUESTIONS.map((q, i) => (
          <li key={i} className="text-sm">
            <p>{q}</p>
            <div className="mt-2 flex gap-2">
              {["Sim", "Não"].map((label, idx) => {
                const val = idx === 0;
                const selected = answers[i] === val;
                return (
                  <button type="button" key={label}
                    onClick={() => { const arr = [...answers]; arr[i] = val; onChange(arr); }}
                    className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest border transition ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-accent"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <Field label="Observações de saúde (opcional)">
        <textarea rows={2} value={notes} onChange={(e) => onNotes(e.target.value)} className={inputCls} />
      </Field>
    </Section>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/40";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-display text-xl text-primary">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function PixScreen({ totalPrice, lotLabel, typeLabel, onClose }: { totalPrice: number; lotLabel: string; typeLabel: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(PIX_INFO.key);
      setCopied(true);
      toast.success("Chave Pix copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-lg bg-background rounded-lg shadow-xl border border-accent/40">
        <div className="border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {lotLabel} · {typeLabel} · {formatBRL(totalPrice)}
            </p>
            <h3 className="font-display text-2xl">Pagamento via Pix</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Sua inscrição foi registrada. Realize o Pix no valor de <span className="text-foreground font-semibold">{formatBRL(totalPrice)}</span> usando os dados abaixo:
          </p>

          <dl className="rounded-md border border-border divide-y divide-border">
            <PixRow label="Chave Pix" value={PIX_INFO.key} />
            <PixRow label="Tipo de chave" value={PIX_INFO.keyType} />
            <PixRow label="Beneficiário" value={PIX_INFO.beneficiary} />
            <PixRow label="Banco" value={PIX_INFO.bank} />
          </dl>

          <button
            type="button"
            onClick={copyKey}
            className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold hover:opacity-90"
          >
            {copied ? "Copiada!" : "Copiar chave Pix"}
          </button>

          <div className="rounded-md bg-secondary/60 border border-border p-4 text-xs text-muted-foreground">
            {PIX_INFO.instructions}
          </div>

          <button type="button" onClick={onClose} className="w-full rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest hover:bg-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function CardScreen({ paymentUrl, totalPrice, lotLabel, typeLabel, onClose }: { paymentUrl: string; totalPrice: number; lotLabel: string; typeLabel: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-lg bg-background rounded-lg shadow-xl border border-accent/40">
        <div className="border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {lotLabel} · {typeLabel} · {formatBRL(totalPrice)}
            </p>
            <h3 className="font-display text-2xl">Pagamento no cartão</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Sua inscrição foi registrada. Clique no botão abaixo para finalizar o pagamento de <span className="text-foreground font-semibold">{formatBRL(totalPrice)}</span> no InfinityPay.
          </p>

          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm uppercase tracking-widest font-semibold hover:opacity-90"
          >
            Ir para o pagamento
          </a>

          <div className="rounded-md bg-secondary/60 border border-border p-4 text-xs text-muted-foreground break-all">
            Se o botão não abrir, copie e cole este link no navegador:
            <div className="mt-2 text-foreground">{paymentUrl}</div>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="w-full rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest hover:bg-secondary"
          >
            {copied ? "Link copiado!" : "Copiar link"}
          </button>

          <button type="button" onClick={onClose} className="w-full rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest hover:bg-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function PixRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-right break-all">{value}</dd>
    </div>
  );
}
