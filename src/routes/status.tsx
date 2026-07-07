import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["sucesso", "pendente", "erro"]).catch("sucesso"),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/status")({
  validateSearch: (s) => statusSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Status da inscrição · WHF" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusPage,
});

type Variant = {
  emoji: string;
  title: string;
  subtitle: string;
  body: React.ReactNode;
  tone: "success" | "pending" | "error";
};

const VARIANTS: Record<"sucesso" | "pendente" | "erro", Variant> = {
  sucesso: {
    emoji: "✓",
    title: "Inscrição confirmada!",
    subtitle: "Pagamento aprovado",
    tone: "success",
    body: (
      <>
        <p>
          Sua vaga no <strong>WANNA HAVE FUN</strong> está garantida.
          Enviaremos os detalhes finais (endereço, o que levar e horário
          exato) para o seu e-mail antes do evento.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          24 de julho · You Smile Fight · São Paulo
        </p>
      </>
    ),
  },
  pendente: {
    emoji: "…",
    title: "Pagamento em processamento",
    subtitle: "Aguardando confirmação",
    tone: "pending",
    body: (
      <>
        <p>
          Seu pagamento foi iniciado, mas ainda não foi confirmado pela
          InfinityPay. Isso costuma acontecer com Pix e boleto.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Assim que a confirmação chegar, sua vaga será liberada
          automaticamente. Você pode fechar esta página.
        </p>
      </>
    ),
  },
  erro: {
    emoji: "!",
    title: "Não conseguimos confirmar seu pagamento",
    subtitle: "Algo deu errado",
    tone: "error",
    body: (
      <>
        <p>
          O pagamento não foi processado ou foi cancelado. Sua vaga ainda
          não está garantida.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Tente novamente pela página de ingressos. Se o valor foi debitado,
          entre em contato conosco pelo Instagram{" "}
          <a
            href="https://www.instagram.com/yousmilefight"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            @yousmilefight
          </a>
          .
        </p>
      </>
    ),
  },
};

function StatusPage() {
  const { status, ref } = Route.useSearch();
  const v = VARIANTS[status];

  const toneClasses =
    v.tone === "success"
      ? "border-primary/40 bg-primary/5 text-primary"
      : v.tone === "pending"
        ? "border-accent/60 bg-accent/10 text-primary"
        : "border-destructive/40 bg-destructive/5 text-destructive";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${toneClasses}`}>
          <span className="font-display text-4xl leading-none">{v.emoji}</span>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {v.subtitle}
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-primary">
          {v.title}
        </h1>

        <div className="mt-6 text-base text-foreground/90 leading-relaxed">
          {v.body}
        </div>

        {ref && (
          <p className="mt-6 text-[11px] uppercase tracking-widest text-muted-foreground">
            Referência: {ref}
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:opacity-90"
          >
            Voltar ao início
          </Link>
          {v.tone === "error" && (
            <Link
              to="/"
              hash="lotes"
              className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest hover:bg-secondary"
            >
              Tentar novamente
            </Link>
          )}
        </div>

        <p className="italic-serif mt-12 text-accent text-sm">
          "Treinar é o plano. Se divertir é a regra."
        </p>
      </div>
    </div>
  );
}
