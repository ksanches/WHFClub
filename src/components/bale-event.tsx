import { Button } from "@/components/ui/button";
import poster from "@/assets/bale-poster.jpg.asset.json";
import giovana from "@/assets/giovana.jpg.asset.json";
import type { WhfEvent } from "@/lib/event";
import { ArrowDown, Check, MapPin } from "lucide-react";

const benefits = ["Força", "Mobilidade", "Postura", "Equilíbrio", "Coordenação", "Consciência corporal"];

export function BaleEvent({ event, children }: { event: WhfEvent; children: React.ReactNode }) {
  const reserve = () => document.getElementById("lotes")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  return <>
    <header className="bale-hero relative overflow-hidden bg-primary text-primary-foreground">
      <img src={poster.url} alt="Arte Aula de Balé + Brunch, WHF Florianópolis, 11 de outubro às 8h, Casa Múltiplas" className="bale-cover" fetchPriority="high" />
      <div className="bale-hero-copy relative mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <p className="text-xs font-semibold">WHF · FLORIANÓPOLIS</p>
        <p className="mt-6 text-sm text-primary-foreground/80">DOMINGO, 11 DE OUTUBRO · 8H</p>
        <h1 className="mt-8 max-w-lg text-5xl leading-tight md:text-7xl">Aula de<br />balé +<br /><em>brunch</em></h1>
        <p className="mt-7 max-w-md text-base leading-7 text-primary-foreground/85">{event.hero_subtitle}</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Button onClick={reserve} variant="secondary" size="lg" className="h-12 rounded-full font-semibold">Quero minha vaga <ArrowDown /></Button>
          <p className="text-sm"><strong>R$ 79,90</strong></p>
        </div>
        <p className="mt-4 text-xs text-primary-foreground/75">Não precisa ter experiência com balé.</p>
      </div>
    </header>

    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:gap-20 md:px-10 md:py-24">
        <div>
          <p className="text-xs font-semibold uppercase">A experiência</p>
          <h2 className="mt-5 text-3xl leading-tight md:text-4xl">Funcional com elementos do balé, de um jeito leve e diferente.</h2>
          <p className="mt-6 text-sm leading-7">A professora de Ballet Clássico Giovana Isotton conduz uma experiência especial com a WHF na Casa Múltiplas, no Centro de Florianópolis.</p>
          <p className="mt-4 text-sm leading-7">Vamos trazer movimentos inspirados na barra, exercícios de pernas e braços, equilíbrio, deslocamentos e sequências simples que fazem a gente sentir o corpo inteiro trabalhando.</p>
        </div>
        <div className="flex flex-col justify-center">
          <ul className="flex flex-wrap gap-3">{benefits.map(benefit => <li key={benefit} className="rounded-full border border-border px-5 py-2 text-sm font-medium">{benefit}</li>)}</ul>
          <p className="mt-8 font-display text-2xl italic">E não precisa ter nenhuma experiência com balé.</p>
          <p className="mt-4 text-sm leading-7">A aula foi pensada para que todas possam participar e aproveitar o movimento dentro das suas possibilidades.</p>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <p className="text-xs font-semibold uppercase">O que está incluso</p>
          <h2 className="mt-5 max-w-xl text-3xl leading-tight md:text-4xl">Mais do que uma aula, uma manhã inteira para você.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[ ["Aula de balé + funcional", "Conduzida pela professora Giovana Isotton, para todos os níveis."], ["Brunch delicioso", "Para o nosso momento de conexão depois da aula."], ["Kit especial", "Com marca parceira, para levar a experiência para casa."] ].map(([title, description]) => <div key={title} className="border-t border-border pt-6"><Check className="mb-5 size-5" /><h3 className="text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></div>)}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-border pt-8"><div><p className="text-xs uppercase">Investimento</p><p className="mt-2 font-display text-4xl">R$ 79,90</p></div><Button onClick={reserve} size="lg" className="h-12 rounded-full">Quero minha vaga <ArrowDown /></Button></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[0.8fr_1fr] md:gap-20 md:px-10 md:py-24">
        <img src={giovana.url} alt="Giovana Isotton, professora de Ballet Clássico" loading="lazy" className="aspect-[4/5] w-full max-w-md rounded-md object-cover" />
        <div><p className="text-xs font-semibold uppercase">Quem conduz</p><h2 className="mt-5 text-4xl md:text-5xl">Giovana Isotton</h2><p className="mt-5 font-display text-xl italic">Professora de Ballet Clássico e diretora artística da Brilhart Escola</p><p className="mt-6 text-sm leading-7">Licenciada em Educação Física e com formação de professora pela Escola Nacional de Ballet Cubano, Giovana dá aulas desde 2017.</p><p className="mt-4 text-sm leading-7">Trabalha o balé a partir da metodologia cubana, valorizando técnica, consciência corporal e o tempo de cada aluna.</p></div>
      </section>

      <section id="info" className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3 md:px-10">
          <div><p className="text-xs uppercase text-primary-foreground/70">Quando</p><p className="mt-3 font-display text-2xl">{event.date_label}</p><p className="mt-2 text-sm">Às {event.time_label}</p></div>
          <div><p className="text-xs uppercase text-primary-foreground/70">Investimento</p><p className="mt-3 font-display text-2xl">R$ 79,90</p><p className="mt-2 text-sm">Aula, brunch e kit</p></div>
          <div><p className="text-xs uppercase text-primary-foreground/70">Onde</p><p className="mt-3 font-display text-2xl">{event.venue_name}</p><p className="mt-2 text-sm leading-6">{event.venue_sub}</p>{event.maps_url && <Button asChild variant="link" className="mt-3 h-auto p-0 text-primary-foreground"><a href={event.maps_url} target="_blank" rel="noopener noreferrer"><MapPin /> Ver no mapa</a></Button>}</div>
        </div>
      </section>
      {children}
    </main>
  </>;
}