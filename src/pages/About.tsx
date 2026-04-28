import { Sparkles, Heart, Lightbulb } from 'lucide-react';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 sm:p-12 mb-8">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            About
          </div>
          <h1 className="font-display mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            A dream that almost
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              didn't make it.
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            The story behind this site — and the person who almost gave up.
          </p>
        </div>
      </div>

      {/* Story */}
      <article className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm">
        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-foreground/90">
          <p className="text-xl font-medium text-foreground">
            Hey, welcome.
          </p>

          <p>
            I'm the person behind this site. And honestly? The fact that this even exists still gets to me a little.
          </p>

          <p>
            Once upon a time, I had a dream of becoming a web developer. I learned a little, dreamed a lot — got so excited about the big ideas living inside my head. But somewhere along the way, I let it go. I didn't have the deep knowledge, the time, or honestly... the belief that I could actually do it.
          </p>

          <p className="font-medium text-foreground">
            So I buried that dream. Or at least, I tried to.
          </p>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <Lightbulb className="h-5 w-5 text-primary" />
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-xl font-semibold text-foreground">
            Then AI came along and changed everything.
          </p>

          <p>
            For the first time in a long time, I felt that old spark again. That quiet little voice saying — hey, maybe you still can. And this time, I listened.
          </p>

          <blockquote className="border-l-4 border-primary bg-primary/5 px-6 py-4 rounded-r-lg italic text-foreground">
            Everything you see here was built with AI. But every idea, every thought, every feeling behind it — that's all me. This site came from a part of myself I thought I'd lost a long time ago.
          </blockquote>

          <p className="font-medium text-foreground">
            I'm not just the owner of this site. I'm someone who almost gave up on a dream — and then didn't.
          </p>

          <div className="mt-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
            <Heart className="mx-auto h-6 w-6 text-primary mb-3" />
            <p className="text-base sm:text-lg font-medium text-foreground">
              So if you're here, thank you. Really.
            </p>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              This one's for every dreamer who almost gave up.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
