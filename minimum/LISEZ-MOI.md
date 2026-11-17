# Cinéma Minimum — site

Site statique (aucune compilation) dans la même famille graphique que le Zinéma
(Aileron, papier gris, trait de 4 px) mais avec son caractère propre : une seule
couleur (orange), un mot immense, une règle graduée, des affiches typographiques.

- Tout le contenu est dans `assets/js/content.js` (coordonnées, tarifs, films, séances).
  Les valeurs « À CONFIRMER » et les films d'exemple sont à remplacer.
- Les séances sont décrites par jour de la semaine ; le site affiche toujours les 7 prochains jours.
- Aperçu local : `python3 -m http.server --directory minimum`
- Domaine : à adapter dans les `og:` si besoin ; le bouton « Réserver » ouvre un courriel
  tant que `billetterie` est vide dans content.js.
