# Carnet d'auto-évaluation Kinyobi

Application web d'auto-évaluation individuelle pour le groupe Kinyobi.

Les participants situent leur pratique sur trois grilles (Technique, Combat, Transversale), définissent leurs objectifs pour les trois prochains mois, puis génèrent un rapport PDF à partager.

## Caractéristiques

- **100 % côté navigateur** — aucun serveur, aucune donnée transmise
- **Brouillon sauvegardé** automatiquement dans le navigateur (localStorage)
- **PDF généré localement** avec html2canvas et jsPDF
- **PWA** — installable sur mobile

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Déploiement

Le site est déployé automatiquement sur GitHub Pages via GitHub Actions à chaque push sur `main`.
