import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-display text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O link que você tentou abrir não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display text-foreground">Algo saiu do plano</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente recarregar em instantes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WANNA HAVE FUN — Evento fitness feminino · 25/07 · You Smile Fight" },
      {
        name: "description",
        content:
          "Inscreva-se no evento WHF: 25/07, aulas às 11h ou 12h no You Smile Fight. Ingresso individual ou em dupla. Vagas limitadas.",
      },
      { name: "author", content: "WHF Club" },
      { property: "og:title", content: "WANNA HAVE FUN — Evento fitness feminino · 25/07 · You Smile Fight" },
      {
        property: "og:description",
        content: "Inscreva-se no evento WHF: 25/07, aulas às 11h ou 12h no You Smile Fight. Ingresso individual ou em dupla. Vagas limitadas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "WANNA HAVE FUN — Evento fitness feminino · 25/07 · You Smile Fight" },
      { name: "twitter:description", content: "Inscreva-se no evento WHF: 25/07, aulas às 11h ou 12h no You Smile Fight. Ingresso individual ou em dupla. Vagas limitadas." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c6f58525-21f5-4f82-b53f-01936543303a/id-preview-b685267f--d84a142f-9749-452b-8844-dca267b842ae.lovable.app-1783451960445.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c6f58525-21f5-4f82-b53f-01936543303a/id-preview-b685267f--d84a142f-9749-452b-8844-dca267b842ae.lovable.app-1783451960445.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
