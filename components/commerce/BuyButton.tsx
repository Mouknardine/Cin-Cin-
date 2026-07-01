interface BuyButtonProps {
  checkoutUrl?: string;
  price?: string;
  label?: string;
  className?: string;
}

/**
 * Bouton de billetterie relié à un lien de paiement SumUp configuré dans
 * Sanity (au niveau de la séance, avec repli sur le film). Tant qu'aucun
 * lien n'est renseigné, le bouton reste visible mais désactivé — le client
 * n'a qu'à coller son lien SumUp dans le Studio pour l'activer.
 */
export function BuyButton({ checkoutUrl, price, label = "Réserver", className = "" }: BuyButtonProps) {
  if (!checkoutUrl) {
    return (
      <span
        className={`inline-flex items-center justify-between gap-4 border border-ink/25 px-5 py-3 font-display text-sm tracking-widen text-ink/55 ${className}`}
        aria-disabled="true"
      >
        Billetterie bientôt disponible
      </span>
    );
  }

  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center justify-between gap-6 border border-ink bg-ink px-5 py-3 font-display text-sm tracking-widen text-paper transition-colors duration-300 hover:bg-red hover:border-red ${className}`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-2">
        {price && <span className="text-paper/70">{price}</span>}
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </a>
  );
}
