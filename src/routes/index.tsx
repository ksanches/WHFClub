import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CLASS_TIMES,
  CLASS_CAPACITY,
  formatBRL,
  formatCents,
  maskCPF,
  isValidCPF,
  maskPhone,
  isValidMobileBR,
  PARQ_QUESTIONS,

  type Lot,
  type Coupon,
  type TicketType,
  type PaymentMethod,
} from "@/lib/whf";
import { getClassOccupancy } from "@/lib/occupancy.functions";
import pixIndividualAsset from "@/assets/pix_individual.jpeg.asset.json";
import pixDuplaAsset from "@/assets/pix_Dupla.jpeg.asset.json";
import pixIndividualLote1Asset from "@/assets/pix_individual_lote1.jpeg.asset.json";
import pixDuplaLote1Asset from "@/assets/pix_dupla_lote1.jpeg.asset.json";

const WHATSAPP_URL = "https://wa.me/5511965008538";



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
  card_url_individual: string | null;
  card_url_dupla: string | null;
  pix_qr_individual_url: string | null;
  pix_qr_dupla_url: string | null;
}

function mapDbLot(r: DbLot): Lot {
  return {
    id: r.id,
    label: r.label,
    total: r.total,
    individual: r.individual_price_cents / 100,
    dupla: r.dupla_price_cents / 100,
    active: r.active,
    sort_order: r.sort_order,
    card_url_individual: r.card_url_individual,
    card_url_dupla: r.card_url_dupla,
    pix_qr_individual_url: r.pix_qr_individual_url,
    pix_qr_dupla_url: r.pix_qr_dupla_url,
  };
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
    try {
      const rows = await getClassOccupancy();
      const map: Record<string, number> = {};
      rows.forEach((r) => { map[r.class_time] = r.participants; });
      setOccupancy(map);
    } catch (e) {
      console.error("Failed to load class occupancy", e);
    }
  }

  useEffect(() => {
    supabase
      .from("lots")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        const rows = (data as DbLot[] | null) ?? [];
        setLots(rows.map(mapDbLot));
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
        <p className="italic-serif text-accent tracking-widest text-xs md:text-sm uppercase">Save the date · 01.08</p>
        <h1 className="wordmark mt-6 text-4xl md:text-6xl leading-tight">Wanna<br />Have Fun.</h1>
        <p className="italic-serif mt-8 text-lg md:text-2xl text-accent">"Treinar é o plano. Se divertir é a regra."</p>
        <p className="mt-4 font-display text-2xl md:text-3xl">Treino Funcional</p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onPickLot} className="rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-primary hover:opacity-90 transition">
            Garantir meu ingresso
          </button>
          <a href="#info" className="rounded-full border border-accent/60 px-8 py-3 text-sm uppercase tracking-widest text-accent hover:bg-accent/10 transition">
            Sobre o evento
          </a>
        </div>
        <p className="mt-10 text-xs uppercase tracking-[0.3em] text-accent/80">Playa SP Chácara · São Paulo</p>
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
        <InfoBlock label="Data" value="01 de Agosto" />
        <InfoBlock label="Aula" value="11h" />
        <InfoBlock label="Local" value="Playa SP Chácara" />
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
        </a>
      ) : content}
    </div>
  );
}

function Lots({ lots, loading, onSelect }: { lots: Lot[]; loading: boolean; onSelect: (lot: Lot, type: TicketType) => void }) {
  const active = lots.filter((l) => l.active);
  return (
    <section id="lotes" className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center mb-14">
        <p className="italic-serif text-accent uppercase tracking-widest text-xs">Ingressos</p>
        <h2 className="mt-2 font-display text-4xl md:text-5xl">Reserve sua Vaga</h2>
        <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
          Ingresso individual · pagamento via Pix. Vagas limitadas.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Carregando lotes…</p>
      ) : active.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhum lote disponível no momento.</p>
      ) : (
        <div className="grid gap-6">
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
  const [freeConfirmation, setFreeConfirmation] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const isDupla = type === "dupla";
  const seatsNeeded = isDupla ? 2 : 1;
  const availableTimes = CLASS_TIMES.filter((t) => (occupancy[t] ?? 0) + seatsNeeded <= CLASS_CAPACITY);

  const couponPriceCents = coupon
    ? (type === "individual" ? coupon.individual_price_cents : coupon.dupla_price_cents)
    : null;
  const lotPrice = type === "individual" ? lot.individual : lot.dupla;
  const originalTotalPrice = isDupla ? lotPrice * 2 : lotPrice;
  const price = couponPriceCents !== null && couponPriceCents !== undefined
    ? couponPriceCents / 100
    : lotPrice;
  const totalPrice = isDupla ? price * 2 : price;
  const isFree = !!coupon && totalPrice === 0;

  const paymentUrl = useMemo(() => {
    if (coupon) {
      const c = type === "individual" ? coupon.card_url_individual : coupon.card_url_dupla;
      if (c) return c;
    }
    const l = type === "individual" ? lot.card_url_individual : lot.card_url_dupla;
    return l || "#";
  }, [coupon, lot, type]);

  const pixQrUrl = useMemo(() => {
    if (coupon) {
      const c = type === "individual" ? coupon.pix_qr_individual_url : coupon.pix_qr_dupla_url;
      if (c) return c;
    }
    const l = type === "individual" ? lot.pix_qr_individual_url : lot.pix_qr_dupla_url;
    if (l) return l;
    if (lot.id === "lote1") {
      return isDupla ? pixDuplaLote1Asset.url : pixIndividualLote1Asset.url;
    }
    return isDupla ? pixDuplaAsset.url : pixIndividualAsset.url;
  }, [coupon, lot, type, isDupla]);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { toast.error("Insira um cupom."); return; }
    setApplyingCoupon(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    setApplyingCoupon(false);
    if (error) { toast.error("Erro ao validar cupom."); return; }
    if (!data) { toast.error("Cupom inválido."); return; }
    const c = data as Coupon;
    if (c.valid_for !== "both" && c.valid_for !== type) {
      toast.error(`Cupom válido apenas para inscrição ${c.valid_for === "individual" ? "individual" : "em dupla"}.`);
      return;
    }
    setCoupon(c);
    toast.success(`Cupom ${c.code} aplicado!`);
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
  }


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
      payment_method: isFree ? "cortesia" : paymentMethod,
      payment_url: isFree ? (coupon?.code ?? "cortesia") : (paymentMethod === "cartao" ? paymentUrl : "pix"),
      status: (coupon?.auto_confirm || isFree) ? "confirmado" : "pendente",
    });
    setSubmitting(false);

    if (error) {
      console.error(error);
      toast.error("Não foi possível salvar sua inscrição. Tente novamente.");
      return;
    }


    onSubmitted();

    if (isFree) {
      toast.success("Inscrição confirmada! Nos vemos no WHF.");
      setFreeConfirmation(true);
    } else if (paymentMethod === "cartao") {
      toast.success(coupon?.auto_confirm ? "Inscrição confirmada!" : "Inscrição registrada! Finalize o pagamento.");
      setCardConfirmation(true);
    } else {
      toast.success(coupon?.auto_confirm ? "Inscrição confirmada!" : "Inscrição registrada! Confira os dados do Pix.");
      setPixConfirmation(true);
    }
  }

  if (freeConfirmation) {
    return <FreeScreen lotLabel={lot.label} couponCode={coupon?.code ?? ""} onClose={onClose} />;
  }

  if (cardConfirmation) {
    return <CardScreen paymentUrl={paymentUrl} totalPrice={totalPrice} lotLabel={lot.label} typeLabel={isDupla ? "Dupla" : "Individual"} onClose={onClose} />;
  }

  if (pixConfirmation) {
    return <PixScreen qrUrl={pixQrUrl} totalPrice={totalPrice} lotLabel={lot.label} typeLabel={isDupla ? "Dupla" : "Individual"} onClose={onClose} />;
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
              {availableTimes.length === 0 ? (
                <p className="text-sm text-destructive">Todas as aulas estão lotadas no momento.</p>
              ) : (
                <div className="flex gap-3">
                  {availableTimes.map((t) => (
                    <label key={t} className={`flex-1 cursor-pointer text-center rounded-md border p-3 transition ${form.classTime === t ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`}>
                      <input type="radio" name="classTime" value={t} checked={form.classTime === t} onChange={() => update("classTime", t)} className="sr-only" />
                      <span className="font-display text-lg">{t}</span>
                      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                        {CLASS_CAPACITY - (occupancy[t] ?? 0)} vagas
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {isDupla && availableTimes.length < CLASS_TIMES.length && (
                <p className="mt-2 text-xs text-muted-foreground">Horários com menos de 2 vagas ficam ocultos para duplas.</p>
              )}
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

          <Section title="Cupom de desconto">
            {coupon ? (
              <div className="flex items-center justify-between gap-4 rounded-md border border-accent bg-accent/10 px-4 py-3 text-sm">
                <span className="space-y-1">
                  <span className="block">
                    Cupom <span className="font-semibold">{coupon.code}</span> aplicado{coupon.description ? ` — ${coupon.description}` : "."}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Valor final: <span className="font-semibold text-foreground">{formatBRL(totalPrice)}</span>
                    {originalTotalPrice !== totalPrice && (
                      <span> · antes {formatBRL(originalTotalPrice)}</span>
                    )}
                  </span>
                </span>
                <button type="button" onClick={removeCoupon} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Insira seu cupom"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon}
                  className="rounded-md border border-primary px-4 py-2 text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
                >
                  {applyingCoupon ? "…" : "Aplicar"}
                </button>
              </div>
            )}
          </Section>

          {!isFree && (
            <Section title="Forma de pagamento">
              <div className="rounded-md border border-accent bg-accent/10 p-4 text-center">
                <span className="block font-display text-lg">Pix</span>
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Única forma de pagamento
                </span>
              </div>
            </Section>
          )}

          <div className="pt-2 flex flex-col sm:flex-row-reverse gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold hover:opacity-90 disabled:opacity-60">
              {submitting
                ? "Enviando..."
                : isFree
                  ? "Confirmar inscrição gratuita"
                  : paymentMethod === "cartao"
                    ? `Finalizar e pagar · ${formatCents(Math.round(totalPrice * 100))}${isDupla ? " (dupla)" : ""}`
                    : `Finalizar e ver dados do Pix · ${formatCents(Math.round(totalPrice * 100))}${isDupla ? " (dupla)" : ""}`}
            </button>
            <button type="button" onClick={onClose} className="rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest hover:bg-secondary">
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {isFree
              ? "Cupom cortesia aplicado — sua inscrição será confirmada automaticamente."
              : paymentMethod === "cartao"
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

function PixScreen({ qrUrl, totalPrice, lotLabel, typeLabel, onClose }: { qrUrl: string; totalPrice: number; lotLabel: string; typeLabel: string; onClose: () => void }) {
  const waMessage = encodeURIComponent(
    `Olá! Segue o comprovante do Pix da inscrição WHF (${lotLabel} · ${typeLabel} · ${formatBRL(totalPrice)}).`
  );
  const waUrl = `${WHATSAPP_URL}?text=${waMessage}`;

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
            Sua inscrição foi registrada. Siga os passos abaixo para pagar <span className="text-foreground font-semibold">{formatBRL(totalPrice)}</span>:
          </p>

          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Abra o aplicativo do seu banco.</li>
            <li>Escolha a opção <span className="text-foreground font-medium">Pagamento Pix via QR Code</span>.</li>
            <li>Escaneie o QR Code abaixo e confirme o pagamento.</li>
            <li>Envie o comprovante pelo WhatsApp para confirmarmos sua inscrição.</li>
          </ol>

          <div className="rounded-md border border-border bg-white p-3 flex items-center justify-center">
            <img
              src={qrUrl}
              alt={`QR Code Pix — ${typeLabel} — ${formatBRL(totalPrice)}`}
              className="w-full max-w-xs h-auto"
            />
          </div>


          <p className="text-xs text-center text-muted-foreground">
            Beneficiário: <span className="text-foreground font-medium">LAIZZA AMANDA VIEGER SALES</span>
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] text-white px-6 py-3 text-sm uppercase tracking-widest font-semibold hover:opacity-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.9 11.9 0 0 0 5.74 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42ZM12.06 21.3h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.98 1-3.66-.24-.38a9.86 9.86 0 0 1-1.52-5.25c0-5.46 4.44-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.86 9.86 0 0 1 2.9 7c0 5.46-4.44 9.9-9.87 9.9Zm5.7-7.4c-.31-.16-1.85-.91-2.14-1.02-.29-.1-.5-.16-.71.16-.21.31-.82 1.02-1 1.23-.19.21-.37.23-.68.08-.31-.16-1.32-.49-2.51-1.55-.93-.83-1.55-1.86-1.73-2.17-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.19.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.4-.01-.61-.01-.21 0-.55.08-.83.39-.29.31-1.09 1.06-1.09 2.58 0 1.52 1.11 2.99 1.27 3.2.16.21 2.19 3.34 5.31 4.68.74.32 1.32.51 1.77.65.74.24 1.42.2 1.95.12.6-.09 1.85-.75 2.11-1.48.26-.73.26-1.36.18-1.48-.08-.13-.29-.21-.6-.36Z"/>
            </svg>
            Enviar comprovante no WhatsApp
          </a>

          <div className="rounded-md bg-secondary/60 border border-border p-4 text-xs text-muted-foreground">
            Após efetuar o Pix, envie o comprovante pelo WhatsApp acima para confirmarmos sua inscrição.
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

function FreeScreen({ lotLabel, couponCode, onClose }: { lotLabel: string; couponCode: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/70 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-lg bg-background rounded-lg shadow-xl border border-accent/40">
        <div className="border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {lotLabel} · Cortesia
            </p>
            <h3 className="font-display text-2xl">Inscrição confirmada</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-8 space-y-5 text-center">
          <p className="text-sm text-muted-foreground">
            {couponCode ? <>Seu cupom cortesia <span className="text-foreground font-semibold">{couponCode}</span> foi aplicado e sua inscrição está </> : "Sua inscrição está "}
            <span className="text-foreground font-semibold">confirmada</span>.
          </p>
          <p className="italic-serif text-accent text-lg">Nos vemos no WHF ✨</p>
          <button type="button" onClick={onClose} className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold hover:opacity-90">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

