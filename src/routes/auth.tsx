import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Acesso das administradoras · WHF" },
    { name: "description", content: "Acesso à administração dos eventos e inscrições WHF." },
    { property: "og:title", content: "Acesso das administradoras · WHF" },
    { property: "og:description", content: "Acesso à administração dos eventos e inscrições WHF." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Conta criada. Peça a um admin para liberar seu acesso.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/admin" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Toaster position="top-center" />
      <form onSubmit={submit} className="w-full max-w-sm border border-accent/30 rounded-lg p-8 bg-card">
        <h1 className="font-display text-3xl text-primary text-center">Admin WHF</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center mt-1">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">E-mail</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Senha</span>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm outline-none focus:border-accent" />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>


        <button type="submit" disabled={loading}
          className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3 text-sm uppercase tracking-widest font-semibold disabled:opacity-60">
          {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          {mode === "login" ? "Criar conta" : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}
