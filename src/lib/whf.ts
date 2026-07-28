export type TicketType = "individual" | "dupla";

export interface Lot {
  id: string;
  label: string;
  total: number;
  individual: number; // BRL
  dupla: number; // BRL (per person)
  active: boolean;
  sort_order: number;
  card_url_individual?: string | null;
  card_url_dupla?: string | null;
  pix_qr_individual_url?: string | null;
  pix_qr_dupla_url?: string | null;
}

export interface Coupon {
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
}

export const CLASS_TIMES = ["11:00"] as const;
export const CLASS_CAPACITY = 30;

// Links reais do InfinityPay (cartão). Lotes 2 e 3 a confirmar.
export const PAYMENT_URLS: Record<string, Record<TicketType, string>> = {
  lote1: {
    individual: "https://link.infinitepay.io/laizza-amanda/VC1D-Q1YFRZjgS3-180,00",
    dupla: "https://link.infinitepay.io/laizza-amanda/VC1D-oUopqjjEBe-300,00",
  },
  lote2: {
    individual: "https://link.infinitepay.io/laizza-amanda/VC1D-4MpzTmn3ZF-200,00",
    dupla: "https://link.infinitepay.io/laizza-amanda/VC1D-97SfzzpP8i-320,00",
  },
  lote3: { individual: "#pagamento-lote3-individual", dupla: "#pagamento-lote3-dupla" },
};

export function paymentUrlFor(lotId: string, type: TicketType): string {
  return PAYMENT_URLS[lotId]?.[type] ?? "#";
}

export type PaymentMethod = "cartao" | "pix";

// Pix copia e cola (R$ 29,90)
export const PIX_COPY_PASTE =
  "00020126510014BR.GOV.BCB.PIX0129whfclub.comercial@hotmail.com520400005303986540529.905802BR592535.952.024 EDUARDA BARCEL6009SAO PAULO62140510YNqHWGH9QR63048F0C";

export const PIX_INFO = {
  key: "whfclub.comercial@hotmail.com",
  keyType: "E-mail",
  beneficiary: "35.952.024 EDUARDA BARCELLOS CHAMBARELLI DE NOVAES",
  bank: "—",
  instructions:
    "Após efetuar o Pix, envie o comprovante pelo WhatsApp para confirmarmos sua inscrição.",
};


export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatCents(cents: number) {
  return formatBRL(cents / 100);
}

// CPF: 000.000.000-00
export function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isValidCPF(v: string) {
  const c = v.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (s % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (s % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

// Telefone móvel BR
export function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 7) return d.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function isValidMobileBR(v: string) {
  const d = v.replace(/\D/g, "");
  return /^[1-9][1-9]9\d{8}$/.test(d);
}

export const PARQ_QUESTIONS = [
  "Algum médico já disse que você possui algum problema de coração e que só deveria realizar atividade física supervisionada por profissionais de saúde?",
  "Você sente dores no peito quando pratica atividade física?",
  "No último mês, você sentiu dores no peito quando não estava praticando atividade física?",
  "Você apresenta desequilíbrio devido à tontura e/ou perda de consciência?",
  "Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?",
  "Você toma atualmente algum medicamento para pressão arterial e/ou problema de coração?",
  "Sabe de alguma outra razão pela qual você não deve praticar atividade física?",
];
