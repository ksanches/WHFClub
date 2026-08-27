export interface WhfEvent {
  id: string;
  name: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_quote: string | null;
  hero_location_line: string | null;
  manifesto: string | null;
  date_label: string;
  time_label: string | null;
  venue_name: string | null;
  venue_sub: string | null;
  maps_url: string | null;
  description: string | null;
  lots_intro: string | null;
  lots_note: string | null;
  pix_copy_paste: string | null;
  pix_key: string | null;
  pix_beneficiary: string | null;
  whatsapp_url: string | null;
  active: boolean;
  created_at?: string;
}

export const EVENT_FIELDS: {
  key: keyof WhfEvent;
  label: string;
  hint?: string;
  multiline?: boolean;
}[] = [
  { key: "name", label: "Nome interno do evento", hint: "Só aparece no painel admin" },
  { key: "hero_title", label: "Título principal", hint: "Use quebras de linha para dividir em duas linhas", multiline: true },
  { key: "hero_subtitle", label: "Subtítulo" },
  { key: "hero_quote", label: "Frase de destaque" },
  { key: "hero_location_line", label: "Linha de local no topo" },
  { key: "manifesto", label: "Manifesto", multiline: true },
  { key: "date_label", label: "Data (texto exibido)", hint: "Ex.: 11 de Setembro" },
  { key: "time_label", label: "Horário (texto exibido)", hint: "Ex.: 18h30" },
  { key: "venue_name", label: "Nome do local" },
  { key: "venue_sub", label: "Complemento do local", hint: "Endereço / bairro" },
  { key: "maps_url", label: "Link do Google Maps" },
  { key: "description", label: "Descrição do evento", multiline: true },
  { key: "lots_intro", label: "Texto acima de “Reserve sua Vaga”" },
  { key: "lots_note", label: "Observação abaixo do título de ingressos", multiline: true },
  { key: "pix_copy_paste", label: "Pix copia e cola", multiline: true },
  { key: "pix_key", label: "Chave Pix" },
  { key: "pix_beneficiary", label: "Beneficiária do Pix" },
  { key: "whatsapp_url", label: "Link do WhatsApp", hint: "Ex.: https://wa.me/5511965008538" },
];

export const EMPTY_EVENT: Omit<WhfEvent, "id" | "active"> = {
  name: "",
  hero_title: "",
  hero_subtitle: "",
  hero_quote: "",
  hero_location_line: "",
  manifesto: "",
  date_label: "",
  time_label: "",
  venue_name: "",
  venue_sub: "",
  maps_url: "",
  description: "",
  lots_intro: "",
  lots_note: "",
  pix_copy_paste: "",
  pix_key: "",
  pix_beneficiary: "",
  whatsapp_url: "https://wa.me/5511965008538",
};
