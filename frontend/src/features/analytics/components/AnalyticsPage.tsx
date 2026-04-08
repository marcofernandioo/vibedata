export function AnalyticsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This route is protected already. Hook it up next to authenticated query functions against
          the NestJS analytics feature.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
        Placeholder analytics dashboard. You can now safely build authenticated data flows here.
      </div>
    </section>
  )
}
