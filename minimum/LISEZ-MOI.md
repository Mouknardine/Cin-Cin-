# Cinéma Minimum — site (Neuchâtel)

Cinéma, radio et club sous le même toit. Site statique (aucune compilation), même base
que le Zinéma : Aileron, papier gris bruité, trait noir de 4 px, cases Mondrian aux
couleurs tirées au hasard, barre de navigation en cases, rose fluo sur le nom et la
signature de l'agence.

- **Cinéma** — programme, tarifs et coordonnées repris de cineminimum.ch, vraies affiches.
- **Radio** — un petit « bureau » d'ordinateur (idée de soso radio) : lecteur avec playlist, grille,
  fenêtres déplaçables, barre des tâches. Fond d'écran : la salle rouge.
- **Club** — prochaines soirées, entrée, règles.
- **Agenda** — les trois mêlés, filtrables.

Tout le contenu est dans `assets/js/content.js`. Les films ont des séances aux dates réelles
(à mettre à jour chaque semaine). **Radio et club : exemples à remplacer** (émissions, pistes,
flux audio `radioFlux`, soirées, entrée).

Aperçu local : `python3 -m http.server`
