import { BuyButton } from "@/components/commerce/BuyButton";
import { formatDayHeading } from "@/lib/dates";
import type { Film, Screening } from "@/lib/types";

const statusText: Record<Screening["status"], string> = {
  disponible: "Places disponibles",
  complet: "Complet",
  annule: "Annulé",
};

export function ScreeningsForFilm({ film }: { film: Film }) {
  const screenings = (film.screenings || []).filter((s) => s.status !== "annule" || true);

  if (screenings.length === 0) {
    return (
      <p className="border-t border-ink/15 py-6 font-display text-sm tracking-widen text-ink/50">
        Aucune séance programmée pour le moment — revenez bientôt.
      </p>
    );
  }

  const byDate = new Map<string, Screening[]>();
  for (const s of screenings) {
    const list = byDate.get(s.date) || [];
    list.push(s);
    byDate.set(s.date, list);
  }

  return (
    <div className="border-t border-ink/15">
      {Array.from(byDate.entries()).map(([date, list]) => (
        <div key={date} className="grid gap-3 border-b border-ink/15 py-5 md:grid-cols-[180px_1fr]">
          <p className="font-display text-sm capitalize tracking-widen text-ink/70">
            {formatDayHeading(date)}
          </p>
          <ul className="flex flex-col gap-3">
            {list.map((s) => (
              <li
                key={s._id}
                className="flex flex-wrap items-center justify-between gap-3 border border-ink/15 px-4 py-3"
              >
                <div>
                  <p className="font-display text-xl tracking-tightest">{s.time}</p>
                  <p className="text-xs text-ink/55">
                    {s.room}
                    {s.versionNote ? ` — ${s.versionNote}` : ""}
                    {" · "}
                    <span className={s.status === "disponible" ? "text-ink/55" : "text-red"}>
                      {statusText[s.status]}
                    </span>
                  </p>
                </div>
                {s.status === "disponible" ? (
                  <BuyButton
                    checkoutUrl={s.sumupCheckoutUrl || film.sumupCheckoutUrl}
                    price={s.price || film.price}
                  />
                ) : (
                  <span className="px-5 py-3 font-display text-sm tracking-widen text-ink/30">
                    {statusText[s.status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
