export type TicketType = "individual" | "dupla";

export interface Lot {
  id: "lote1" | "lote2" | "lote3";
  label: string;
  total: number;
  individual: number; // BRL
  dupla: number; // BRL (per person)
}

export const LOTS: Lot[] = [
  { id: "lote1", label: "1º Lote", total: 8, individual: 180, dupla: 150 },
  { id: "lote2", label: "2º Lote", total: 14, individual: 210, dupla: 170 },
  { id: "lote3", label: "3º Lote", total: 14, individual: 250, dupla: 190 },
];

export const CLASS_TIMES = ["11:00", "12:00"] as const;

// Placeholder payment URLs — troque pelos links reais do InfinityPay.
export const PAYMENT_URLS: Record<Lot["id"], Record<TicketType, string>> = {
  lote1: { individual: "#pagamento-lote1-individual", dupla: "#pagamento-lote1-dupla" },
  lote2: { individual: "#pagamento-lote2-individual", dupla: "#pagamento-lote2-dupla" },
  lote3: { individual: "#pagamento-lote3-individual", dupla: "#pagamento-lote3-dupla" },
};

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

// Telefone móvel BR: (11) 91234-5678
export function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 7)
    return d.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function isValidMobileBR(v: string) {
  const d = v.replace(/\D/g, "");
  // 11 dígitos, DDD 11–99, 9º dígito começa com 9
  return /^[1-9][1-9]9\d{8}$/.test(d);
}
