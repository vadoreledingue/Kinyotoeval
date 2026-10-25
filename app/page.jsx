"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/* Version 7 : PDF préparé localement puis partagé par le menu de l'appareil.
   Aucun envoi automatique ; le schéma V4, les couleurs des niveaux,
   les couleurs Kinyobi et le logo sont conservés. */
const PALETTE = {
  violet: "#48519E", cyan: "#30BDDD", orange: "#E9560F", or: "#F18B08",
  cyanTexte: "#08758B", orangeTexte: "#B23D05",
  encre: "#24263D", secondaire: "#62667D", ligne: "#DBDEED"
};
// Palette des niveaux indépendante de PALETTE : ne pas la recolorer avec le thème.
const NIVEAUX = [
  { label: "Non exploré", court: "NE", couleur: "#F6F3EA", bordure: "#C9C2AE", texte: "#3A362C" },
  { label: "Novice", court: "N", couleur: "#E7B93E", bordure: "#C79A22", texte: "#3A2E05" },
  { label: "Débutant", court: "D", couleur: "#DD8A34", bordure: "#B76A1C", texte: "#3A1F03" },
  { label: "Apprenti", court: "A", couleur: "#4F8F55", bordure: "#376B3B", texte: "#FFFFFF" },
  { label: "Pratiquant", court: "P", couleur: "#3B6EA5", bordure: "#28527F", texte: "#FFFFFF" },
  { label: "Confirmé", court: "C", couleur: "#7A4B2E", bordure: "#5C3620", texte: "#FFFFFF" },
  { label: "Avancé", court: "AV", couleur: "#1E1B18", bordure: "#000000", texte: "#FFFFFF" }
];

// Deux listes séparées : renommer Technique ne modifie pas Combat.
const GRILLES = [
  {
    cle: "technique", nom: "Technique", accent: PALETTE.violet, texteAccent: PALETTE.violet,
    domaines: ["Artistique", "Pieds-poings", "Projection", "Sol", "Armes"],
    sousTitre: "Connaissances et capacités relatives aux familles d'actions martiales."
  },
  {
    cle: "combat", nom: "Combat", accent: PALETTE.orange, texteAccent: PALETTE.orangeTexte,
    domaines: ["Poings", "Pieds-poings", "Lutte", "Sol", "Armes"],
    sousTitre: "Capacité à mobiliser ces ressources en opposition : percevoir, décider, s'adapter."
  },
  {
    cle: "transversale", nom: "Transversale", accent: PALETTE.cyan, texteAccent: PALETTE.cyanTexte,
    domaines: ["Culture martiale", "Corps humain", "Compétences psycho-sociales", "Condition physique", "Pédagogie"],
    sousTitre: "Compétences qui soutiennent la pratique sans être des actions martiales."
  }
];

// Cinq réponses obligatoires, validées avant la génération locale du PDF.
const CHAMPS_OBJECTIF = [
  {
    cle: "champDevelopper", label: "Champ à développer",
    question: "Quel champ veux-tu développer ?",
    aide: "Sélectionne un des cinq champs de cette catégorie.", max: 180, lignes: 2
  },
  {
    cle: "objectifPrecis", label: "Objectif précis et mesurable",
    question: "Qu'est-ce que tu veux apprendre ?",
    aide: "Indique-le le plus clairement possible. Précise un résultat observable ou mesurable pour savoir si tu as réussi.", max: 600, lignes: 3
  },
  {
    cle: "niveauActuel", label: "Niveau actuel",
    question: "Où est-ce que tu te situes par rapport à ton objectif ?",
    aide: "Qu'est-ce que tu connais déjà ? Qu'est-ce que tu sais déjà faire ?", max: 300, lignes: 3
  },
  {
    cle: "moyenAction", label: "Moyens d'action",
    question: "Comment vas-tu t'y prendre pour atteindre ton objectif ?",
    aide: "Qu'est-ce que tu vas faire concrètement pour t'entraîner ?", max: 500, lignes: 3
  },
  {
    cle: "tempsInvestir", label: "Temps à investir",
    question: "Combien de temps vas-tu investir par semaine ou par entraînement de karaté/kinyobi ?",
    aide: "Indique une durée et une fréquence, par exemple 10 minutes à chaque entraînement.", max: 180, lignes: 2
  }
];

// Exemples pédagogiques, pas des réponses préremplies ni des objectifs imposés.
// Les mêmes domaines peuvent avoir des exemples différents en Technique et en Combat.
const EXEMPLES_PAR_CHAMP = {
  "technique": {
    "Artistique": {
      "objectifPrecis": "Présenter un enchaînement de 30 secondes appris au cours, en respectant l'ordre des mouvements, sur trois essais consécutifs.",
      "niveauActuel": "Je connais les premiers mouvements, mais j'oublie encore la suite de l'enchaînement.",
      "moyenAction": "Travailler l'enchaînement par petits morceaux, puis les réunir et demander un retour au responsable.",
      "tempsInvestir": "10 minutes à chaque entraînement de karaté, deux fois par semaine."
    },
    "Pieds-poings": {
      "objectifPrecis": "Réaliser sur des cibles un enchaînement de quatre actions défini avec le responsable, dans le bon ordre et avec contrôle, sur cinq essais.",
      "niveauActuel": "Je réalise les actions séparément, mais je perds l'équilibre quand je les enchaîne.",
      "moyenAction": "Décomposer l'enchaînement, le travailler lentement sur cibles, puis demander au partenaire de vérifier mon équilibre.",
      "tempsInvestir": "Deux séquences de 5 minutes à chaque entraînement de karaté."
    },
    "Projection": {
      "objectifPrecis": "Réaliser deux projections choisies avec le responsable sur un partenaire coopératif, en respectant les repères et consignes convenus, trois fois chacune.",
      "niveauActuel": "Je reconnais les deux projections, mais j'ai encore besoin d'être guidé pour les réaliser.",
      "moyenAction": "Revoir les repères avec le responsable, pratiquer avec un partenaire coopératif sous encadrement et demander un retour.",
      "tempsInvestir": "15 minutes par entraînement de kinyobi, une fois par semaine."
    },
    "Sol": {
      "objectifPrecis": "Reconnaître trois positions au sol et réaliser deux transitions choisies avec le responsable, sans aide et avec un partenaire coopératif.",
      "niveauActuel": "Je reconnais une position, mais je confonds encore les deux autres et leurs transitions.",
      "moyenAction": "Revoir les positions, les nommer avec un partenaire puis répéter les transitions lentement avec un retour du responsable.",
      "tempsInvestir": "10 minutes à chaque entraînement de kinyobi."
    },
    "Armes": {
      "objectifPrecis": "Présenter un enchaînement de cinq mouvements avec une arme d'entraînement inerte, sans oubli et en respectant toutes les consignes de sécurité convenues.",
      "niveauActuel": "Je connais trois mouvements de l'enchaînement, mais pas encore leur ordre complet.",
      "moyenAction": "Revoir la séquence avec le responsable, puis travailler par étapes, avec du matériel d'entraînement autorisé et sous encadrement.",
      "tempsInvestir": "10 minutes par entraînement de kinyobi, sous encadrement."
    }
  },
  "combat": {
    "Poings": {
      "objectifPrecis": "Dans cinq échanges de 30 secondes en opposition légère, toucher une cible autorisée puis retrouver la distance convenue au moins trois fois.",
      "niveauActuel": "Je trouve parfois une ouverture, mais je reste souvent à la même distance après mon action.",
      "moyenAction": "Faire des échanges à thème avec un partenaire, à intensité convenue, puis noter les situations où j'ai retrouvé la bonne distance.",
      "tempsInvestir": "10 minutes d'exercices à thème par entraînement de karaté."
    },
    "Pieds-poings": {
      "objectifPrecis": "Dans un exercice à thème, choisir une action adaptée à la distance dans quatre situations sur cinq, selon les critères définis avec le responsable.",
      "niveauActuel": "J'utilise surtout les poings, même lorsque la distance ne s'y prête pas.",
      "moyenAction": "Travailler des échanges courts avec des distances variées, puis demander un retour sur mes choix après chaque échange.",
      "tempsInvestir": "15 minutes par entraînement de kinyobi."
    },
    "Lutte": {
      "objectifPrecis": "Créer un déséquilibre contrôlé dans trois essais sur cinq face à une opposition adaptée, dans une situation définie avec le responsable.",
      "niveauActuel": "J'attends surtout l'action de mon partenaire et je crée rarement une occasion moi-même.",
      "moyenAction": "Travailler une situation de lutte à thème avec différents partenaires, sous encadrement, puis noter ce qui m'aide à créer une occasion.",
      "tempsInvestir": "Trois échanges de 2 minutes, suivis de 4 minutes de retour, par entraînement de kinyobi."
    },
    "Sol": {
      "objectifPrecis": "Réussir trois sorties de contrôle sur cinq essais, depuis une position et contre une opposition définies avec le responsable.",
      "niveauActuel": "Je reconnais la position, mais je reste souvent bloqué lorsque le partenaire résiste.",
      "moyenAction": "Travailler des échanges à thème depuis cette position, avec une résistance convenue, puis discuter des difficultés avec le partenaire.",
      "tempsInvestir": "15 minutes d'opposition à thème par entraînement de kinyobi."
    },
    "Armes": {
      "objectifPrecis": "Dans cinq échanges courts avec du matériel en mousse autorisé, atteindre trois fois une cible convenue sans sortir des règles de l'exercice.",
      "niveauActuel": "Je connais les règles, mais j'ai du mal à choisir le bon moment lorsque le partenaire se déplace.",
      "moyenAction": "Participer à des échanges à thème sous encadrement, avec protections et intensité définies par le responsable, puis discuter du choix du moment.",
      "tempsInvestir": "10 minutes par entraînement de kinyobi, uniquement sous encadrement."
    }
  },
  "transversale": {
    "Culture martiale": {
      "objectifPrecis": "Présenter en cinq minutes les origines de deux arts martiaux et trois différences entre eux, en citant au moins deux sources.",
      "niveauActuel": "Je connais les noms de ces disciplines, mais je confonds encore leurs origines et leurs objectifs.",
      "moyenAction": "Choisir deux sources avec le responsable, prendre des notes et préparer une courte présentation au groupe.",
      "tempsInvestir": "20 minutes de lecture par semaine et une présentation à la fin des trois mois."
    },
    "Corps humain": {
      "objectifPrecis": "Nommer et expliquer trois mouvements de l'épaule et situer les os concernés sur un schéma, sans regarder mes notes.",
      "niveauActuel": "Je connais le nom de quelques os, mais je ne sais pas encore expliquer les mouvements de l'épaule.",
      "moyenAction": "Étudier un support validé avec le responsable, annoter un schéma, puis expliquer les mouvements à un partenaire.",
      "tempsInvestir": "Deux séances de 15 minutes d'étude par semaine."
    },
    "Compétences psycho-sociales": {
      "objectifPrecis": "Lors de trois retours avec un partenaire, reformuler sa demande et lui demander confirmation avant de proposer une solution.",
      "niveauActuel": "J'écoute, mais je propose souvent une solution avant de vérifier si j'ai bien compris.",
      "moyenAction": "M'entraîner à reformuler lors des échanges de fin de séance et demander au partenaire ce qu'il pense de mon écoute.",
      "tempsInvestir": "5 minutes à la fin de chaque entraînement de karaté/kinyobi."
    },
    "Condition physique": {
      "objectifPrecis": "Réussir une traction sans assistance selon les critères d'exécution définis avec le responsable.",
      "niveauActuel": "Je réalise une traction avec assistance, mais pas encore sans aide.",
      "moyenAction": "Suivre une progression adaptée avec le responsable, noter mes essais et vérifier régulièrement la qualité de l'exécution.",
      "tempsInvestir": "Deux séances de 10 minutes par semaine, selon le programme convenu."
    },
    "Pédagogie": {
      "objectifPrecis": "Présenter un exercice en moins de deux minutes à deux partenaires, qui peuvent ensuite reformuler l'objectif et les consignes sans aide.",
      "niveauActuel": "Je connais l'exercice, mais mes explications sont longues et les partenaires doivent souvent me redemander les consignes.",
      "moyenAction": "Préparer une explication courte, l'essayer avec des partenaires, vérifier leur compréhension et demander un retour au responsable.",
      "tempsInvestir": "15 minutes de préparation par semaine et 5 minutes de mise en pratique au cours."
    }
  }
};

const PLACEHOLDERS_OBJECTIF = {
  objectifPrecis: "Décris ce que tu souhaites apprendre et comment tu sauras que tu as réussi.",
  niveauActuel: "Décris ce que tu connais déjà, ce que tu sais faire et ce qui reste difficile.",
  moyenAction: "Indique les actions concrètes que tu prévois pour t'entraîner.",
  tempsInvestir: "Indique une durée et une fréquence."
};

function domainesCategorie(categorie) {
  return GRILLES.find((g) => g.cle === categorie)?.domaines || [];
}

function champAutorise(categorie, champ) {
  return typeof champ === "string" && domainesCategorie(categorie).includes(champ.trim());
}

function exemplesPourObjectif(objectif) {
  if (!champAutorise(objectif.categorie, objectif.champDevelopper)) return null;
  return EXEMPLES_PAR_CHAMP[objectif.categorie]?.[objectif.champDevelopper.trim()] || null;
}

const STORAGE_KEY = "kinyobi-autoevaluation-v4";
const ANCIENS_STOCKAGES = [
  ["kinyobi-autoevaluation-v3", 3],
  ["kinyobi-autoevaluation-v2", 2],
  ["kinyobi-autoevaluation-v1", 1]
];
const MAX_OBJECTIFS = 100; // Protection technique, sans imposer un maximum de trois objectifs.

function etatInitial() {
  return Object.fromEntries(GRILLES.map((g) => [g.cle, Object.fromEntries(g.domaines.map((d) => [d, 0]))]));
}

function nouveauObjectif(categorie = "", id) {
  return {
    id: id || (globalThis.crypto?.randomUUID?.() ?? `objectif-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    categorie, champDevelopper: "", objectifPrecis: "", niveauActuel: "", moyenAction: "", tempsInvestir: ""
  };
}

function objectifsInitiaux() {
  // Identifiants déterministes au premier rendu pour éviter un écart serveur/navigateur.
  return GRILLES.map((g) => nouveauObjectif(g.cle, `initial-${g.cle}`));
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateFR(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("fr-CH", { day: "2-digit", month: "long", year: "numeric" });
}

function slugify(value) {
  return String(value || "participant").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "participant";
}

function texte(value) { return typeof value === "string" ? value : ""; }

function niveauValide(value) {
  return Number.isInteger(value) && value >= 0 && value < NIVEAUX.length;
}

function normaliserNiveaux(source, ancien = false) {
  const resultat = etatInitial();
  for (const grille of GRILLES) {
    for (const domaine of grille.domaines) {
      let valeur = source?.[grille.cle]?.[domaine];
      // Renommages proches : on peut récupérer ces évaluations.
      if (ancien && valeur === undefined && grille.cle === "technique" && domaine === "Projection") {
        valeur = source?.technique?.Lutte;
      }
      if (ancien && valeur === undefined && grille.cle === "transversale" && domaine === "Corps humain") {
        valeur = source?.transversale?.Biologie;
      }
      // Renommage demandé : conserve la note du brouillon V2, à réévaluer au besoin.
      if (valeur === undefined && grille.cle === "transversale" && domaine === "Compétences psycho-sociales") {
        valeur = source?.transversale?.["Gestion émotionnelle"];
      }
      // Les anciens Poings techniques et Compétences sociales de la V1 ne sont
      // pas attribués automatiquement aux nouveaux domaines. La copie V1 reste intacte.
      resultat[grille.cle][domaine] = niveauValide(valeur) ? valeur : 0;
    }
  }
  return resultat;
}

function normaliserObjectifs(source) {
  const ids = new Set();
  const resultat = (Array.isArray(source) ? source : [])
    .filter((o) => o && typeof o === "object" && !Array.isArray(o))
    .map((o) => {
      let id = texte(o.id);
      if (!id || ids.has(id) || !/^[a-zA-Z0-9_-]+$/.test(id)) id = nouveauObjectif().id;
      ids.add(id);
      const objectif = nouveauObjectif(GRILLES.some((g) => g.cle === o.categorie) ? o.categorie : "", id);
      for (const champ of CHAMPS_OBJECTIF) objectif[champ.cle] = texte(o[champ.cle]);
      // Conserver les anciens champs libres comme aide à la reprise, sans leur
      // attribuer arbitrairement un des cinq domaines. Les quatre réponses restent intactes.
      const ancienChamp = texte(o.ancienChampDevelopper);
      if (champAutorise(objectif.categorie, objectif.champDevelopper)) {
        objectif.champDevelopper = objectif.champDevelopper.trim();
        if (ancienChamp) objectif.ancienChampDevelopper = ancienChamp;
      } else {
        const actuel = objectif.champDevelopper.trim() ? objectif.champDevelopper : "";
        if (actuel || ancienChamp) {
          objectif.ancienChampDevelopper = [ancienChamp, actuel].filter((s, i, a) => s && a.indexOf(s) === i).join("\n");
        }
        objectif.champDevelopper = "";
      }
      // Migration V1/V2 : réunir l'objectif et le niveau visé, sans tronquer.
      // Le nouveau champ à développer reste vide : on ne le devine pas à partir du titre.
      if (!Object.prototype.hasOwnProperty.call(o, "objectifPrecis")) {
        const parties = [texte(o.titre), texte(o.niveauVise), texte(o.critere)]
          .filter((v) => v.trim());
        const uniques = parties.filter((v, i) => parties.findIndex((p) => p.trim() === v.trim()) === i);
        objectif.objectifPrecis = uniques.join("\n\n");
      }
      return objectif;
    });
  for (const grille of GRILLES) {
    if (!resultat.some((o) => o.categorie === grille.cle)) resultat.push(nouveauObjectif(grille.cle));
  }
  return resultat;
}

function actualiserObjectif(objectif, champ, valeur) {
  if (champ !== "categorie") return { ...objectif, [champ]: valeur };
  const suivant = { ...objectif, categorie: valeur };
  if (!champAutorise(valeur, suivant.champDevelopper)) {
    // Ne pas effacer les autres réponses en changeant une catégorie.
    const actuel = texte(suivant.champDevelopper);
    if (actuel.trim()) {
      suivant.ancienChampDevelopper = [texte(suivant.ancienChampDevelopper), actuel]
        .filter((s, i, a) => s && a.indexOf(s) === i).join("\n");
    }
    suivant.champDevelopper = "";
  }
  return suivant;
}

function erreursObjectif(objectif) {
  const erreurs = [];
  if (!GRILLES.some((g) => g.cle === objectif.categorie)) erreurs.push("Catégorie à choisir");
  for (const champ of CHAMPS_OBJECTIF) {
    const valeur = texte(objectif[champ.cle]);
    if (!valeur.trim()) erreurs.push(champ.cle === "champDevelopper" ? "Champ à développer : sélectionne un des cinq champs" : `${champ.label} à compléter`);
    else if (champ.cle === "champDevelopper" && !champAutorise(objectif.categorie, valeur)) erreurs.push("Choisis un champ appartenant à cette catégorie");
    else if (valeur.length > champ.max) erreurs.push(`${champ.label} : ${champ.max} caractères maximum`);
  }
  return erreurs;
}

function objectifComplet(objectif) { return erreursObjectif(objectif).length === 0; }

function nettoyerObjectifs(objectifs) {
  return objectifs.map((o) => ({
    id: o.id, categorie: o.categorie,
    ...Object.fromEntries(CHAMPS_OBJECTIF.map((c) => [c.cle, texte(o[c.cle]).trim()]))
  }));
}

function erreursEvaluation(nom, objectifs) {
  const erreurs = [];
  if (!texte(nom).trim()) erreurs.push("Renseigne ton nom et ton prénom.");
  else if (nom.trim().length > 100) erreurs.push("Le nom ne doit pas dépasser 100 caractères.");
  for (const grille of GRILLES) {
    if (!objectifs.some((o) => o.categorie === grille.cle && objectifComplet(o))) {
      erreurs.push(`${grille.nom} : complète au moins un objectif avec ses cinq champs.`);
    }
  }
  const incomplets = objectifs.filter((o) => !objectifComplet(o)).length;
  if (incomplets) erreurs.push(`${incomplets} objectif(s) incomplet(s) : complète-les ou supprime les objectifs supplémentaires inutilisés.`);
  if (objectifs.length > MAX_OBJECTIFS) erreurs.push(`Le rapport est limité à ${MAX_OBJECTIFS} objectifs.`);
  return erreurs;
}

function BarreNiveau({ domaine, valeur, onChange, disabled }) {
  const niveau = NIVEAUX[valeur] || NIVEAUX[0];
  return (
    <div className="level-row">
      <div className="level-row-head">
        <span className="level-domain">{domaine}</span>
        <span className="level-value" style={{ color: niveau.bordure }}>{niveau.label}</span>
      </div>
      <div className="belt" role="radiogroup" aria-label={`Niveau pour ${domaine}`}>
        {NIVEAUX.map((n, i) => (
          <button key={n.label} type="button" role="radio" aria-checked={i === valeur}
            aria-label={n.label} title={n.label} disabled={disabled}
            className={`belt-segment${i === valeur ? " active" : ""}`}
            style={{ background: i <= valeur ? n.couleur : "#FFFFFF", borderColor: i <= valeur ? n.bordure : "#D8D3C4" }}
            onClick={() => onChange(i)}>
            {i === valeur ? <span style={{ color: n.texte }}>{n.court}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

// SVG déterministe : libellés longs sur deux lignes, rendu identique écran/PDF,
// aucune animation susceptible de produire un radar vide lors de la capture.
function RadarGrille({ grille, data, rapport = false }) {
  const cx = 180, cy = 132, rayon = 76;
  const position = (i, r) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / grille.domaines.length;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const points = (r) => grille.domaines.map((_, i) => position(i, r).join(",")).join(" ");
  const contour = grille.domaines.map((d, i) => position(i, rayon * ((data?.[d] ?? 0) / 6)).join(",")).join(" ");
  const lignes = {
    "Culture martiale": ["Culture", "martiale"], "Corps humain": ["Corps humain"],
    "Compétences psycho-sociales": ["Compétences", "psycho-sociales"], "Condition physique": ["Condition", "physique"]
  };
  return (
    <svg viewBox="0 0 360 258" width="360" height="258" className={rapport ? "v2-pdf-radar-svg" : "v2-radar-svg"}
      role="img" aria-label={`Auto-évaluation ${grille.nom} : ${grille.domaines.map((d) => `${d}, ${NIVEAUX[data?.[d] ?? 0]?.label}`).join(" ; ")}`}>
      {[1, 2, 3, 4, 5, 6].map((n) => <polygon key={n} points={points(rayon * n / 6)} fill="none" stroke={PALETTE.ligne} strokeWidth="1" />)}
      {grille.domaines.map((_, i) => {
        const [x, y] = position(i, rayon);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={PALETTE.ligne} strokeWidth="1" />;
      })}
      <polygon points={contour} fill={grille.accent} fillOpacity="0.22" stroke={grille.accent} strokeWidth="2.2" />
      {grille.domaines.map((d, i) => {
        const [x, y] = position(i, rayon * ((data?.[d] ?? 0) / 6));
        return <circle key={d} cx={x} cy={y} r="3" fill={grille.accent}><title>{d} : {NIVEAUX[data?.[d] ?? 0]?.label}</title></circle>;
      })}
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <text key={n} x={cx + 5} y={cy - rayon * n / 6 + 3} fontSize="8.5" fill={PALETTE.secondaire} fontFamily="Arial, sans-serif">{NIVEAUX[n].court}</text>
      ))}
      {grille.domaines.map((d, i) => {
        const [x, y] = position(i, rayon + 27);
        const anchor = i === 0 || i === 2 || i === 3 ? "middle" : i === 1 ? "start" : "end";
        const words = lignes[d] || [d];
        const startY = i === 0 ? y - (words.length === 2 ? 12 : 4) : y - (words.length - 1) * 6;
        return <text key={d} x={x} y={startY} textAnchor={anchor} fill={PALETTE.encre} fontSize="12" fontFamily="Arial, sans-serif">
          {words.map((word, line) => <tspan key={line} x={x} dy={line === 0 ? 0 : 13}>{word}</tspan>)}
          <tspan x={x} dy="14" fontSize="10" fontWeight="bold" fill={grille.texteAccent}>{NIVEAUX[data?.[d] ?? 0]?.court || "NE"}</tspan>
        </text>;
      })}
    </svg>
  );
}

function FormulaireObjectif({ objectif, numero, onChange, onDelete, peutSupprimer, disabled, afficherErreurs }) {
  const complet = objectifComplet(objectif);
  const domaines = domainesCategorie(objectif.categorie);
  const exemples = exemplesPourObjectif(objectif);
  const erreurs = erreursObjectif(objectif);
  const champsRef = useRef(null);
  useEffect(() => {
    const bloc = champsRef.current;
    if (!bloc) return undefined;
    const champs = Array.from(bloc.querySelectorAll("textarea"));
    const ajuster = (champ) => {
      const largeur = champ.getBoundingClientRect().width;
      if (!largeur) return;
      const style = window.getComputedStyle(champ);
      const miroir = document.createElement("textarea");
      miroir.setAttribute("aria-hidden", "true");
      miroir.tabIndex = -1;
      miroir.style.cssText = "position:fixed;left:-10000px;top:0;height:0;min-height:0;max-height:none;visibility:hidden;overflow:hidden;resize:none;box-sizing:border-box;";
      ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "borderTopWidth", "borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderStyle", "wordBreak", "overflowWrap"].forEach((cle) => { miroir.style[cle] = style[cle]; });
      miroir.style.width = `${largeur}px`;
      miroir.value = champ.value || champ.placeholder || " ";
      document.body.appendChild(miroir);
      const bordures = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
      const lignes = parseFloat(style.lineHeight) || 23;
      const minimum = lignes * (Number(champ.getAttribute("rows")) || 3) + (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0) + bordures;
      const hauteur = Math.ceil(Math.max(minimum, miroir.scrollHeight + bordures + 3));
      miroir.remove();
      champ.style.height = `${hauteur}px`;
    };
    champs.forEach(ajuster);
    let largeurPrecedente = bloc.getBoundingClientRect().width;
    const redimensionner = () => {
      const largeur = bloc.getBoundingClientRect().width;
      if (Math.abs(largeur - largeurPrecedente) > 1) {
        largeurPrecedente = largeur;
        champs.forEach(ajuster);
      }
    };
    const observateur = typeof ResizeObserver !== "undefined" ? new ResizeObserver(redimensionner) : null;
    if (observateur) observateur.observe(bloc);
    else window.addEventListener("resize", redimensionner);
    return () => {
      observateur?.disconnect();
      window.removeEventListener("resize", redimensionner);
    };
  }, [objectif]);
  const reponsesRemplies = CHAMPS_OBJECTIF.filter((champ) => {
    const valeur = texte(objectif[champ.cle]);
    return champ.cle === "champDevelopper" ? champAutorise(objectif.categorie, valeur) : valeur.trim() && valeur.length <= champ.max;
  }).length;
  return (
    <article className={`v2-goal-card${complet ? " is-complete" : ""}`}>
      <div className="v2-goal-header">
        <h4>Objectif {numero}</h4>
        <span className={`v2-badge${complet ? " complete" : ""}`}>
          {complet ? "Complet" : `${reponsesRemplies}/5 réponses`}
        </span>
        <button className="v2-delete" type="button" disabled={!peutSupprimer || disabled}
          title={peutSupprimer ? "Supprimer cet objectif" : "Conserve au moins un objectif dans cette catégorie"}
          onClick={() => onDelete(objectif.id)}>Supprimer</button>
      </div>
      {!objectif.categorie ? (
        <label className="v2-field v2-field-full">
          <span>Dans quelle catégorie se situe cet objectif ? <b aria-hidden="true">*</b></span>
          <select aria-label="Catégorie de l'ancien objectif" required disabled={disabled} value={objectif.categorie}
            onChange={(e) => onChange(objectif.id, "categorie", e.target.value)}>
            <option value="">Choisir une catégorie</option>
            {GRILLES.map((g) => <option key={g.cle} value={g.cle}>{g.nom}</option>)}
          </select>
        </label>
      ) : null}
      <div className="v2-goal-fields" ref={champsRef}>
        {CHAMPS_OBJECTIF.map((champ, i) => {
          const value = texte(objectif[champ.cle]);
          const estSelection = champ.cle === "champDevelopper";
          const valeurCorrecte = estSelection ? champAutorise(objectif.categorie, value) : value.trim() && value.length <= champ.max;
          const invalide = afficherErreurs && !valeurCorrecte;
          const id = `objectif-${objectif.id}-${champ.cle}`;
          const exemple = exemples?.[champ.cle];
          const ancien = estSelection && texte(objectif.ancienChampDevelopper);
          const descriptions = [`${id}-aide`, ...(ancien ? [`${id}-ancien`] : [])].join(" ");
          return <div className="v2-field v2-field-full" key={champ.cle}>
            <label className="v3-question" htmlFor={id}>
              <i aria-hidden="true">{i + 1}</i><span>{champ.question} <b aria-hidden="true">*</b></span>
            </label>
            <small id={`${id}-aide`}>{champ.aide}</small>
            {estSelection ? <>
              <select id={id} name={id} required value={valeurCorrecte ? value.trim() : ""}
                disabled={disabled || domaines.length === 0} aria-invalid={invalide || undefined}
                aria-describedby={descriptions} onChange={(e) => onChange(objectif.id, champ.cle, e.target.value)}>
                <option value="" disabled>{domaines.length ? "Choisir un champ" : "Choisis d'abord une catégorie"}</option>
                {domaines.map((domaine) => <option key={domaine} value={domaine}>{domaine}</option>)}
              </select>
              {ancien ? <div className="v4-old-field" id={`${id}-ancien`}>
                <strong>Ancien champ saisi :</strong> <span>{ancien}</span>
                <small>Cette note est conservée pour t'aider. Sélectionne un champ dans le menu et reprends les précisions utiles dans ton objectif.</small>
              </div> : null}

            </> : <>
              <textarea id={id} name={id} value={value} required maxLength={champ.max} disabled={disabled}
                rows={champ.lignes} placeholder={exemple ? `Exemple : ${exemple}` : PLACEHOLDERS_OBJECTIF[champ.cle]} aria-invalid={invalide || undefined}
                aria-describedby={descriptions} onChange={(e) => onChange(objectif.id, champ.cle, e.target.value)} />
              <span className="v2-counter">{value.length}/{champ.max}</span>
            </>}
          </div>;
        })}
      </div>
      {afficherErreurs && erreurs.length ? <p className="v2-field-error">{erreurs.join(" · ")}</p> : null}
    </article>
  );
}

// Image locale fournie par l'association, conservée sans modification.
function LogoKinyobi({ rapport = false }) {
  return (
    <img
      className={rapport ? "v6-logo v6-logo-pdf" : "v6-logo"}
      src={`${BASE_PATH}/kinyobi-logo.png`}
      alt="Logo Kinyobi"
      width={1322}
      height={1396}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}

function RapportPDF({ reportRef, nom, date, levels, objectifs }) {
  const ordonnes = GRILLES.flatMap((g) => objectifs.filter((o) => o.categorie === g.cle));
  return (
    <div className="v2-pdf-stage" aria-hidden="true">
      <div className="v2-pdf-report" ref={reportRef}>
        <header className="v2-pdf-header" data-pdf-block="header">
          <div className="v6-pdf-brand">
            <LogoKinyobi rapport />
            <div><div className="v2-pdf-kicker">Kinyobi · suivi individuel</div><h2>Auto-évaluation</h2></div>
          </div>
          <div className="v2-pdf-person"><strong>{nom.trim() || "Nom non renseigné"}</strong><span>{formatDateFR(date)}</span></div>
        </header>
        <div data-pdf-block="charts">
          <div className="v2-pdf-radars">
            {GRILLES.map((g) => <section className={`v2-pdf-radar-card ${g.cle}`} key={g.cle}>
              <h3 style={{ color: g.texteAccent }}>{g.nom}</h3>
              <RadarGrille grille={g} data={levels[g.cle]} rapport />
            </section>)}
          </div>
          <div className="v2-pdf-legend">
            {NIVEAUX.map((n) => <span key={n.court}><b>{n.court}</b> {n.label}</span>)}
          </div>
        </div>
        <div className="v2-pdf-section-title" data-pdf-block="heading"><h3>Objectifs des trois prochains mois</h3><span>{ordonnes.length} objectif(s)</span></div>
        {ordonnes.map((o, index) => {
          const g = GRILLES.find((grille) => grille.cle === o.categorie);
          return <article className="v2-pdf-goal" key={o.id} data-pdf-block="objective">
            <div className="v2-pdf-goal-title"><span style={{ color: g.texteAccent }}>{index + 1}. {g.nom}</span><strong>Mon objectif</strong></div>
            <div className="v2-pdf-goal-fields">
              {CHAMPS_OBJECTIF.map((champ, n) => <div key={champ.cle} className={`v3-pdf-field ${champ.cle}`}>
                <b>{n + 1}. {champ.question}</b><p>{o[champ.cle]}</p>
              </div>)}
            </div>
          </article>;
        })}
      </div>
    </div>
  );
}

const STYLES_V2 = `
  .v7-share-instruction { margin:18px 0 12px; padding:16px 18px; border:1px solid #DBDEED; border-left:4px solid #30BDDD; border-radius:10px; background:#F0F2FB; color:#24263D; font-size:17px; line-height:1.5; font-weight:600; }
  .v7-share-instruction strong { color:#B23D05; }
  .v7-pdf-ready { display:grid; gap:5px; padding:16px 18px; margin:14px 0; border:1px solid #77CCDF; border-radius:9px; background:#EDF9FC; color:#08758B; }
  .v7-pdf-ready span { overflow-wrap:anywhere; font-size:13px; color:#24263D; }
  .v7-pdf-ready small,.v7-share-help { font-size:12px; line-height:1.6; }
  .v7-share-help { color:#62667D; }
  @media(max-width:600px) { .report-panel .action-row { align-items:stretch; } .report-panel .action-row > button { width:100%; } }
  .v2-loading { padding:32px; }
  .v2-notice { margin:14px 0; padding:14px 16px; background:#fff9e8; border:1px solid #d8cba0; border-radius:9px; font-size:13px; line-height:1.6; }
  .v2-notice p { margin:0 0 6px; }
  .v2-notice button { border:0; background:transparent; text-decoration:underline; cursor:pointer; padding:4px 0; color:#473d26; }
  .v2-form { margin:0; }
  .v2-progress { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:0 0 22px; }
  .v2-progress-item { border:1px solid var(--line); border-radius:9px; padding:12px; background:var(--paper-2); }
  .v2-progress-item strong,.v2-progress-item span { display:block; }
  .v2-progress-item strong { font-size:14px; margin-bottom:5px; }
  .v2-progress-item span { font-size:12px; color:var(--ink-soft); line-height:1.4; }
  .v2-progress-item.complete { border-color:#8aac8c; background:#f2f7f0; }
  .v2-goal-section { margin:26px 0; scroll-margin-top:18px; }
  .v2-section-header { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:10px; }
  .v2-section-header h3 { margin:0; font-size:18px; }
  .v2-section-header p { font-size:12px; color:var(--ink-soft); margin:0; }
  .v2-goal-card { border:1px solid var(--line); border-radius:10px; background:#fbfaf6; padding:17px; margin:12px 0; }
  .v2-goal-card.is-complete { border-color:#a5bca4; }
  .v2-goal-header { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:17px; }
  .v2-goal-header h4 { font-size:14px; margin:0; }
  .v2-badge { border:1px solid #d8cba0; background:#fff5dc; color:#6b5119; padding:4px 8px; border-radius:20px; font-size:11px; }
  .v2-badge.complete { background:#edf5ea; border-color:#a5bca4; color:#2f6236; }
  .v2-delete { margin-left:auto; border:0; background:transparent; color:var(--danger); font-size:12px; padding:8px 0; cursor:pointer; }
  .v2-delete:disabled { opacity:.4; cursor:not-allowed; }
  .v2-goal-fields { display:grid; grid-template-columns:minmax(0,1fr); gap:18px; }
  .v3-question { display:flex; align-items:flex-start; gap:10px; line-height:1.5; }
  .v3-question i { flex:0 0 23px; height:23px; display:flex; align-items:center; justify-content:center; background:#eae5d9; color:#514b3b; border-radius:50%; font-size:11px; font-style:normal; }
  .v2-field .v3-question { font-size:14px; font-weight:700; }
  .v3-question b { color:#9f3f28; }
  .v2-field small { line-height:1.5; }
  .v3-question span { min-width:0; }
  .v2-field > small { margin-left:33px; }
  .v3-mini-note { font-size:12px; color:#6b6656; line-height:1.5; }
  .v2-field { display:flex; flex-direction:column; min-width:0; gap:5px; }
  .v2-field-full { grid-column:1/-1; }
  .v2-field > span:first-child { font-size:13px; font-weight:700; }
  .v2-field > span b { color:#9f3f28; }
  .v2-field small { font-size:12px; color:var(--ink-soft); }
  .v2-field textarea,.v2-field select { width:100%; min-width:0; border:1.5px solid var(--line); padding:10px 11px; background:white; color:var(--ink); border-radius:7px; font:inherit; font-size:15px; line-height:1.45; resize:vertical; }
  .v2-field textarea:focus,.v2-field select:focus { outline:2px solid #c9d8e6; border-color:#3b6ea5; }
  .v2-field textarea[aria-invalid="true"],.v2-field select[aria-invalid="true"] { border-color:#9f3f28; }
  .v2-field select { min-height:46px; cursor:pointer; }
  .v2-field select:disabled { cursor:not-allowed; opacity:.6; }
  .v4-old-field { padding:10px 12px; border:1px solid #dfd0ac; background:#fff8e7; border-radius:6px; font-size:12px; line-height:1.5; overflow-wrap:anywhere; }
  .v4-old-field > span { white-space:pre-wrap; }
  .v4-old-field small { display:block; margin-top:4px; }
  .v2-field .v2-counter { font-size:10px; font-weight:400; color:#827b6b; text-align:right; }
  .v2-field-error { color:#9f3f28; font-size:12px; line-height:1.5; }
  .v2-legend-note { color:var(--ink-soft); font-size:12px; line-height:1.5; }
  .v2-errors { background:#fff3ed; border:1px solid #deb8a8; border-radius:8px; padding:12px 15px; margin:16px 0; color:#743421; font-size:13px; line-height:1.6; }
  .v2-errors p { margin:0 0 6px; font-weight:700; }
  .v2-errors ul { margin:0; padding-left:20px; }
  .v2-radar-svg { display:block; width:100%; height:auto; max-width:470px; margin:auto; }
  .grid-card > .interactive-radar { order:0; }
  .v2-save-note { margin:10px 0; font-size:12px; color:var(--ink-soft); }
  .v2-stage-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:20px; }
  .v2-ready { color:#2f6a39; font-weight:700; font-size:13px; }
  .v2-pdf-stage { position:fixed; left:-12000px; top:0; width:714px; pointer-events:none; z-index:-1; }
  .v2-pdf-report { width:714px; color:#262319; background:white; font-family:Arial,Helvetica,sans-serif; }
  .v2-pdf-report * { box-sizing:border-box; }
  .v2-pdf-header { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; padding:7px 0 13px; border-bottom:2px solid #3a362c; }
  .v2-pdf-kicker { font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#6b6656; margin-bottom:6px; }
  .v2-pdf-header h2 { font-size:26px; line-height:1.1; margin:0; text-transform:uppercase; letter-spacing:-.7px; }
  .v2-pdf-person { max-width:315px; text-align:right; overflow-wrap:anywhere; }
  .v2-pdf-person strong { display:block; font-size:14px; line-height:1.3; }
  .v2-pdf-person span { display:block; font-size:11px; color:#6b6656; margin-top:4px; }
  .v2-pdf-radars { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 12px; padding-top:2px; }
  .v2-pdf-radar-card { display:flex; flex-direction:column; align-items:center; border:1px solid #d8d2bf; border-radius:9px; padding:8px 0 0; }
  .v2-pdf-radar-card h3 { font-size:12px; margin:0; text-transform:uppercase; letter-spacing:.5px; }
  .v2-pdf-radar-card.transversale { grid-column:1/-1; width:390px; justify-self:center; }
  .v2-pdf-radar-svg { display:block; width:328px; height:214px; }
  .v2-pdf-radar-card.transversale .v2-pdf-radar-svg { width:370px; height:220px; }
  .v2-pdf-legend { display:flex; flex-wrap:wrap; justify-content:center; gap:5px 10px; padding:10px 0 0; color:#6b6656; font-size:10px; }
  .v2-pdf-legend b { color:#262319; }
  .v2-pdf-section-title { display:flex; justify-content:space-between; align-items:baseline; gap:12px; padding:7px 0; border-bottom:1px solid #d8d2bf; }
  .v2-pdf-section-title h3 { font-size:14px; margin:0; text-transform:uppercase; }
  .v2-pdf-section-title span { font-size:10px; color:#6b6656; }
  .v2-pdf-goal { padding:11px 13px; background:#f8f6ef; border:1px solid #ded8c8; border-radius:8px; overflow-wrap:anywhere; }
  .v2-pdf-goal-title { display:flex; align-items:baseline; gap:10px; margin-bottom:9px; font-size:13px; line-height:1.35; }
  .v2-pdf-goal-title span { white-space:nowrap; font-size:11px; font-weight:700; text-transform:uppercase; }
  .v2-pdf-goal-title strong { white-space:pre-wrap; min-width:0; }
  .v2-pdf-goal-fields { display:grid; grid-template-columns:minmax(0,1fr); gap:7px; }
  .v2-pdf-goal-fields b { display:block; font-size:10px; font-weight:600; line-height:1.35; color:#736b58; margin-bottom:2px; }
  .v2-pdf-goal-fields p { font-size:12px; line-height:1.4; margin:0; white-space:pre-wrap; }
  .v3-pdf-field + .v3-pdf-field { border-top:1px solid #e9e4d8; padding-top:5px; }
  /* Palette du logo : violet #48519E, cyan #30BDDD, orange #E9560F, or #F18B08. */
  :root {
    --brand-violet:#48519E; --brand-cyan:#30BDDD; --brand-orange:#E9560F; --brand-gold:#F18B08;
    --paper:#F5F6FB; --paper-2:#F0F2FB; --ink:#24263D; --ink-soft:#62667D;
    --line:#DBDEED; --card:#FFFFFF; --danger:#A7370D; --success:#08758B;
  }
  html,body { background:var(--paper); color:var(--ink); }
  .app-shell { border-top:5px solid var(--brand-violet); border-image:linear-gradient(90deg,#48519E 0%,#48519E 45%,#30BDDD 45%,#30BDDD 73%,#E9560F 73%,#E9560F 92%,#F18B08 92%) 1; }
  .main-header h1,.eyebrow,.section-heading h2 { color:var(--brand-violet); }
  .identity-card { background:#F0F2FB; }
  .tabs { border-bottom-color:var(--line); }
  .tabs button.active { color:var(--brand-violet); border-bottom-color:var(--brand-orange); background:#EFF0FA; border-radius:7px 7px 0 0; }
  .tabs button:hover:not(.active) { color:var(--brand-violet); background:#F0F2FB; }
  .primary-button { background:var(--brand-violet); border-color:var(--brand-violet); color:white; }
  .primary-button:hover:not(:disabled) { background:#363F80; border-color:#363F80; }
  .secondary-button { border-color:var(--brand-violet); color:var(--brand-violet); background:white; }
  .secondary-button:hover:not(:disabled) { background:#F0F2FB; }
  .text-button:hover:not(:disabled) { color:var(--brand-violet); }
  .card { box-shadow:0 8px 30px rgba(72,81,158,.04); }
  .identity-card input:focus,.v2-field textarea:focus,.v2-field select:focus { outline:3px solid rgba(48,189,221,.22); border-color:var(--brand-violet); }
  button:focus-visible { outline:3px solid #30BDDD; outline-offset:3px; }
  .belt-segment.active { box-shadow:inset 0 0 0 2px #262319; }
  .v5-objectives-title { margin-bottom:18px; }
  .v2-progress-item { background:#F7F8FD; }
  .v2-progress-item.complete { border-color:#77CCDF; background:#EDF9FC; }
  .v2-goal-card { background:#F9FAFE; }
  .v2-goal-card.is-complete { border-color:#77CCDF; }
  .v2-goal-header h4 { color:var(--brand-violet); }
  .v2-badge { background:#FFF1E7; border-color:#EDC3A6; color:#914000; }
  .v2-badge.complete { background:#E8F8FC; border-color:#77CCDF; color:#086779; }
  .v3-question i { background:#E7E9F7; color:var(--brand-violet); }
  .v3-question b,.v2-field > span b,.v2-field-error { color:var(--danger); }
  .v2-field textarea { background:#FFFFFF; overflow-y:hidden; }
  .v2-field textarea::placeholder { color:#697187; opacity:1; }
  .v2-field textarea[aria-invalid="true"],.v2-field select[aria-invalid="true"] { border-color:var(--danger); }
  .v2-field .v2-counter,.v3-mini-note { color:var(--ink-soft); }
  .v2-ready { color:#08758B; }
  .v2-errors { background:#FFF4EC; border-color:#EBC2A7; color:#8F3510; }
  .v2-notice,.v4-old-field { background:#FFF7EC; border-color:#EBC89D; }
  .v2-notice button { color:#8F3510; }
  .privacy-note { background:#F0F2FB; border-left-color:var(--brand-cyan); }
  .v2-pdf-report { color:#24263D; }
  .v2-pdf-header { border-bottom-color:#48519E; }
  .v2-pdf-header h2,.v2-pdf-kicker { color:#48519E; }
  .v2-pdf-person span,.v2-pdf-section-title span,.v2-pdf-legend { color:#62667D; }
  .v2-pdf-legend b { color:#24263D; }
  .v2-pdf-radar-card { border-color:#DBDEED; }
  .v2-pdf-section-title { border-bottom-color:#DBDEED; color:#48519E; }
  .v2-pdf-goal { background:#F7F8FC; border-color:#DBDEED; }
  .v2-pdf-goal-fields b { color:#535D7B; }
  .v3-pdf-field + .v3-pdf-field { border-top-color:#E2E5F0; }

  /* Identité Kinyobi : l'image reste proportionnée, y compris dans le PDF. */
  .v6-brand-heading { display:flex; align-items:center; gap:16px; margin-bottom:12px; }
  .v6-brand-copy { min-width:0; }
  .v6-brand-heading h1 { margin-bottom:0; }
  .v6-logo { display:block; flex:0 0 auto; width:68px; height:72px; object-fit:contain; }
  .v6-pdf-brand { display:flex; align-items:center; gap:12px; min-width:0; }
  .v6-pdf-brand > div { min-width:0; }
  .v6-logo-pdf { width:52px; height:55px; }
  .v2-pdf-header { align-items:center; }
  .v2-pdf-person { max-width:270px; }

  @media(max-width:600px) {
    .v6-brand-heading { gap:12px; }
    .v6-brand-heading > .v6-logo { width:54px; height:57px; }
    .v6-brand-heading .eyebrow { font-size:10px; letter-spacing:.1em; }
    .v6-brand-heading h1 { font-size:clamp(24px,6.2vw,32px); line-height:1.08; }
    .v2-progress { grid-template-columns:1fr; gap:7px; }
    .v2-goal-fields { grid-template-columns:1fr; gap:12px; }
    .v2-goal-card { padding:13px; }
    .v2-field textarea,.v2-field select,.identity-card input { font-size:16px; }
    .v2-goal-header { gap:8px; }
    .v2-stage-actions > button { width:100%; }
  }
`;

// Une signature empêche de partager un PDF devenu ancien après modification.
function signatureEvaluation(nom, date, levels, objectifs) {
  return JSON.stringify({ nom: nom.trim(), date, levels, objectifs: nettoyerObjectifs(objectifs) });
}

function peutPartagerPDF(fichier) {
  if (!fichier || typeof window === "undefined" || !window.isSecureContext ||
      typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try { return navigator.canShare({ files: [fichier] }); }
  catch { return false; }
}

function messageErreurPartage(error) {
  if (error?.name === "AbortError") {
    return "Partage annulé ou aucune application disponible. Ton PDF reste prêt à être partagé ou téléchargé.";
  }
  if (error?.name === "NotAllowedError") {
    return "Le navigateur a bloqué le partage. Réessaie avec le bouton ou télécharge le PDF pour le joindre à un message.";
  }
  return "Le partage n'a pas abouti. Ton PDF reste disponible : télécharge-le pour l'envoyer depuis l'application de ton choix.";
}

export default function Page() {
  const [pret, setPret] = useState(false);
  const [onglet, setOnglet] = useState("technique");
  const [nom, setNom] = useState("");
  const [date, setDate] = useState("");
  const [levels, setLevels] = useState(etatInitial);
  const [objectifs, setObjectifs] = useState(objectifsInitiaux);
  const [statut, setStatut] = useState("idle");
  const [message, setMessage] = useState("");
  const [pdfPrepare, setPdfPrepare] = useState(null);
  const [migration, setMigration] = useState(false);
  const [stockageErreur, setStockageErreur] = useState("");
  const [afficherErreurs, setAfficherErreurs] = useState(false);
  const reportRef = useRef(null);
  const busyRef = useRef(false);
  const busy = statut === "pdf" || statut === "sharing";
  const signatureActuelle = useMemo(
    () => signatureEvaluation(nom, date, levels, objectifs), [nom, date, levels, objectifs]
  );
  const signatureRef = useRef(signatureActuelle);
  signatureRef.current = signatureActuelle;
  const pdfCourant = pdfPrepare?.signature === signatureActuelle ? pdfPrepare : null;
  const partageDisponible = Boolean(pdfCourant && peutPartagerPDF(pdfCourant.fichier));

  // Une date, un nom, un niveau ou une réponse modifiés imposent un nouveau PDF.
  useEffect(() => {
    setPdfPrepare((precedent) => precedent && precedent.signature !== signatureActuelle ? null : precedent);
  }, [signatureActuelle]);

  useEffect(() => {
    let donnees = null;
    let versionSource = 4;
    try {
      for (const [cle, version] of [[STORAGE_KEY, 4], ...ANCIENS_STOCKAGES]) {
        const brut = localStorage.getItem(cle);
        if (!brut) continue;
        try {
          const candidate = JSON.parse(brut);
          if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Format de brouillon invalide");
          donnees = candidate;
          versionSource = version;
          break;
        } catch {
          // Conserver le contenu pour pouvoir le récupérer, même s'il est illisible.
          try { localStorage.setItem(`${cle}-sauvegarde-illisible`, brut); } catch { /* sans conséquence */ }
          setStockageErreur("Un ancien brouillon était illisible. Il n'a pas été effacé ; vérifie les réponses récupérées.");
        }
      }
      if (donnees) {
        setNom(texte(donnees.nom || donnees.nomEleve));
        setLevels(normaliserNiveaux(donnees.levels, versionSource === 1));
        setObjectifs(normaliserObjectifs(donnees.objectifs));
        setMigration(versionSource < 4 || Boolean(donnees.migrationAConfirmer));
      }
    } catch {
      setStockageErreur("Le brouillon n'a pas pu être chargé. Tu peux remplir l'évaluation, mais vérifie la sauvegarde avant de fermer la page.");
    }
    setDate(todayISO());
    setPret(true);
    const actualiserDate = () => setDate(todayISO());
    window.addEventListener("focus", actualiserDate);
    const timer = window.setInterval(actualiserDate, 60000);
    return () => { window.removeEventListener("focus", actualiserDate); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!pret) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 4, nom, levels, objectifs, migrationAConfirmer: migration }));
    } catch {
      setStockageErreur("La sauvegarde locale est indisponible. Ne ferme pas cette page avant d'avoir téléchargé ou partagé ton rapport.");
    }
  }, [nom, levels, objectifs, migration, pret]);

  const grilleActive = useMemo(() => GRILLES.find((g) => g.cle === onglet), [onglet]);
  const erreurs = useMemo(() => erreursEvaluation(nom, objectifs), [nom, objectifs]);
  const complets = useMemo(() => Object.fromEntries(GRILLES.map((g) => [g.cle,
    objectifs.filter((o) => o.categorie === g.cle && objectifComplet(o)).length])), [objectifs]);
  const sansCategorie = objectifs.filter((o) => !GRILLES.some((g) => g.cle === o.categorie));

  function signalerModification() {
    setMessage("");
    setPdfPrepare(null);
  }

  const setNiveau = useCallback((cle, domaine, valeur) => {
    if (busyRef.current) return;
    setLevels((prev) => ({ ...prev, [cle]: { ...prev[cle], [domaine]: valeur } }));
    setMessage("");
    setPdfPrepare(null);
  }, []);

  function modifierObjectif(id, champ, valeur) {
    if (busyRef.current) return;
    setObjectifs((prev) => {
      const modifie = prev.map((o) => o.id === id ? actualiserObjectif(o, champ, valeur) : o);
      // Lors du classement d'un ancien objectif, retire seulement un brouillon
      // initial entièrement vide de cette catégorie. Aucun texte n'est perdu.
      if (champ === "categorie" && valeur) {
        const vide = modifie.find((o) => o.id !== id && o.categorie === valeur && CHAMPS_OBJECTIF.every((c) => !texte(o[c.cle]).trim()) && !texte(o.ancienChampDevelopper).trim());
        if (vide) return modifie.filter((o) => o.id !== vide.id);
      }
      return modifie;
    });
    signalerModification();
  }

  function ajouterObjectif(categorie) {
    if (busyRef.current || objectifs.length >= MAX_OBJECTIFS) return;
    setObjectifs((prev) => [...prev, nouveauObjectif(categorie)]);
    signalerModification();
  }

  function supprimerObjectif(id) {
    if (busyRef.current) return;
    const cible = objectifs.find((o) => o.id === id);
    if (!cible) return;
    if (cible.categorie && objectifs.filter((o) => o.categorie === cible.categorie).length <= 1) return;
    if ((CHAMPS_OBJECTIF.some((c) => texte(cible[c.cle]).trim()) || texte(cible.ancienChampDevelopper).trim()) && !window.confirm("Supprimer cet objectif et ses réponses ?")) return;
    setObjectifs((prev) => prev.filter((o) => o.id !== id));
    signalerModification();
  }

  function allerAuRapport(event) {
    event?.preventDefault();
    setAfficherErreurs(true);
    setOnglet("rapport");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function creerPDF() {
    const problemes = erreursEvaluation(nom, objectifs);
    if (problemes.length) throw new Error("Complète les cinq champs de chaque objectif, avec au moins un objectif par catégorie.");
    const root = reportRef.current;
    if (!root) throw new Error("Rapport indisponible.");
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    if (document.fonts?.ready) await document.fonts.ready;
    try {
      await Promise.all(Array.from(root.querySelectorAll("img")).map(async (image) => {
        if (typeof image.decode === "function") {
          await image.decode();
        } else if (!image.complete) {
          await new Promise((resolve, reject) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", reject, { once: true });
          });
        }
        if (!image.naturalWidth) throw new Error("Image indisponible.");
      }));
    } catch {
      throw new Error("Le logo Kinyobi ne peut pas être chargé. Vérifie que kinyobi-logo.png se trouve dans le dossier public, puis recharge la page.");
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const largeurPage = pdf.internal.pageSize.getWidth();
    const hauteurPage = pdf.internal.pageSize.getHeight();
    const marge = 10;
    const largeur = largeurPage - marge * 2;
    const bas = hauteurPage - 17; // Pied de page réservé.
    const facteur = largeur / root.getBoundingClientRect().width;
    const espace = 2.5;
    let y = marge;
    let headerCanvas = null;
    const blocs = Array.from(root.querySelectorAll("[data-pdf-block]"));

    const ajouterImage = (canvas) => {
      const hauteur = largeur * canvas.height / canvas.width;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", marge, y, largeur, hauteur, undefined, "FAST");
      y += hauteur + espace;
    };
    const capture = (element) => html2canvas(element, {
      scale: 2, backgroundColor: "#FFFFFF", useCORS: true, logging: false,
      windowWidth: 1200, windowHeight: 1400,
      onclone: (doc) => {
        const stage = doc.querySelector(".v2-pdf-stage");
        if (stage) { stage.style.left = "0"; stage.style.position = "absolute"; stage.style.zIndex = "9999"; }
      }
    });
    const nouvellePage = () => {
      pdf.addPage("a4", "portrait");
      y = marge;
      if (headerCanvas) ajouterImage(headerCanvas);
    };

    // Chaque objectif reste entier : pas de capture unique découpée au milieu d'un texte.
    for (let i = 0; i < blocs.length; i += 1) {
      const bloc = blocs[i];
      const type = bloc.dataset.pdfBlock;
      const hauteurEstimee = bloc.getBoundingClientRect().height * facteur;
      let reserve = hauteurEstimee;
      // Ne laisse jamais le titre « Objectifs » seul en bas de page.
      if (type === "heading" && blocs[i + 1]) reserve += espace + blocs[i + 1].getBoundingClientRect().height * facteur;
      if (type !== "header" && y + reserve > bas) nouvellePage();
      const canvas = await capture(bloc);
      const hauteurReelle = largeur * canvas.height / canvas.width;
      if (hauteurReelle > bas - y + 0.5) {
        // Les limites de champs rendent ce cas rare ; aucune réponse n'est tronquée.
        if (type === "objective") throw new Error("Un objectif est trop long pour une page lisible. Raccourcis ses réponses ou répartis-le en plusieurs objectifs.");
        if (type !== "header") nouvellePage();
      }
      if (type === "header") headerCanvas = canvas;
      ajouterImage(canvas);
    }

    const total = pdf.getNumberOfPages();
    for (let p = 1; p <= total; p += 1) {
      pdf.setPage(p);
      pdf.setDrawColor(219, 222, 237);
      pdf.line(marge, hauteurPage - 12, largeurPage - marge, hauteurPage - 12);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(98, 102, 125);
      pdf.text("Auto-évaluation personnelle : un support de progression, pas un classement.", marge, hauteurPage - 7.5);
      pdf.text(`${p} / ${total}`, largeurPage - marge, hauteurPage - 7.5, { align: "right" });
    }
    return pdf;
  }

  async function preparerPDF() {
    if (busyRef.current) return;
    setAfficherErreurs(true);
    if (erreursEvaluation(nom, objectifs).length) {
      setOnglet("rapport");
      setMessage("Le rapport n'est pas encore complet. Consulte les éléments à compléter ci-dessus.");
      return;
    }
    busyRef.current = true;
    setStatut("pdf");
    setMessage("");
    setPdfPrepare(null);
    const dateRapport = todayISO();
    const signature = signatureEvaluation(nom, dateRapport, levels, objectifs);
    setDate(dateRapport);
    try {
      const pdf = await creerPDF();
      const blob = pdf.output("blob");
      if (!blob || !blob.size) throw new Error("Le PDF n'a pas pu être créé. Réessaie.");
      if (signatureRef.current !== signature) {
        throw new Error("L'évaluation ou la date a changé. Prépare à nouveau le PDF pour utiliser les informations à jour.");
      }
      const nomFichier = `autoevaluation-${slugify(nom)}-${dateRapport}.pdf`;
      // Le Blob et le File restent en mémoire ; aucune transmission au serveur.
      const fichier = typeof File === "function"
        ? new File([blob], nomFichier, { type: "application/pdf", lastModified: Date.now() }) : null;
      setPdfPrepare({ blob, fichier, nomFichier, pages: pdf.getNumberOfPages(), signature });
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Impossible de produire le rapport sur cet appareil.");
    } finally {
      setStatut("idle");
      busyRef.current = false;
    }
  }

  async function partagerPDF() {
    if (busyRef.current) return;
    if (!pdfCourant || erreursEvaluation(nom, objectifs).length || pdfCourant.signature !== signatureRef.current) {
      setMessage("Prépare d'abord le PDF avec tes réponses actuelles.");
      return;
    }
    if (!peutPartagerPDF(pdfCourant.fichier)) {
      setMessage("Le partage de fichiers n'est pas disponible ici. Télécharge le PDF pour l'envoyer depuis l'application de ton choix.");
      return;
    }
    busyRef.current = true;
    setStatut("sharing");
    setMessage("");
    try {
      // Aucun await avant share : l'appel reste lié au clic de l'utilisateur.
      // Partager le fichier seul offre la meilleure compatibilité entre applications.
      await navigator.share({ files: [pdfCourant.fichier] });
      // Cette promesse ne prouve ni l'envoi ni la réception chez un destinataire.
      setMessage("Vérifie l'envoi dans l'application choisie. Tu peux partager à nouveau le même PDF.");
    } catch (error) {
      setMessage(messageErreurPartage(error));
    } finally {
      setStatut("idle");
      busyRef.current = false;
    }
  }

  function telechargerPDFPrepare() {
    if (busyRef.current) return;
    if (!pdfCourant || erreursEvaluation(nom, objectifs).length || pdfCourant.signature !== signatureRef.current) {
      setMessage("Prépare d'abord le PDF avec tes réponses actuelles.");
      return;
    }
    let url = null;
    let lien = null;
    try {
      url = URL.createObjectURL(pdfCourant.blob);
      lien = document.createElement("a");
      lien.href = url;
      lien.download = pdfCourant.nomFichier;
      lien.style.display = "none";
      document.body.appendChild(lien);
      lien.click();
      setMessage("Téléchargement demandé. Tu peux joindre ce PDF à un message dans l'application de ton choix.");
    } catch {
      setMessage("Le téléchargement n'a pas démarré. Réessaie ou utilise le bouton de partage s'il est disponible.");
    } finally {
      lien?.remove();
      // Laisse au navigateur le temps de prendre en charge le téléchargement.
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }

  function reinitialiser() {
    if (busyRef.current || !window.confirm("Effacer le brouillon actuel et recommencer ?")) return;
    setNom(""); setLevels(etatInitial()); setObjectifs(objectifsInitiaux()); setPdfPrepare(null);
    setOnglet("technique"); setStatut("idle"); setMessage(""); setMigration(false); setAfficherErreurs(false); setStockageErreur("");
    try { for (const cle of [STORAGE_KEY, ...ANCIENS_STOCKAGES.map(([cle]) => cle)]) localStorage.removeItem(cle); } catch { /* sans conséquence */ }
  }

  if (!pret) return <main className="app-shell"><p className="v2-loading" role="status">Chargement du carnet…</p></main>;

  return (
    <main className="app-shell">
      <style>{STYLES_V2}</style>
      <header className="main-header">
        <div className="v6-brand-intro">
          <div className="v6-brand-heading">
            <LogoKinyobi />
            <div className="v6-brand-copy">
              <div className="eyebrow">Kinyobi · suivi individuel</div>
              <h1>Carnet d'auto-évaluation</h1>
            </div>
          </div>
          <p>Situe ta pratique sur les trois grilles, puis définis au moins un objectif par catégorie pour les trois prochains mois.</p>
        </div>
        <div className="identity-card">
          <label htmlFor="nom">Nom et prénom</label>
          <input id="nom" autoComplete="name" placeholder="Ex. Alex Martin" value={nom} maxLength={100} disabled={busy}
            onChange={(e) => { setNom(e.target.value); signalerModification(); }} />
          <span>{formatDateFR(date)}</span>
        </div>
      </header>

      {stockageErreur ? <div className="v2-notice" role="alert">{stockageErreur}</div> : <p className="v2-save-note">Brouillon enregistré automatiquement sur cet appareil.</p>}
      {migration ? <div className="v2-notice" role="status">
        <p><strong>Ton brouillon a été récupéré.</strong> La question 1 propose désormais les cinq champs de chaque catégorie dans un menu déroulant.</p>
        <p>Si un ancien champ était écrit librement, son texte reste affiché sous le menu : choisis le champ correspondant, puis relis tes réponses. Aucun exemple ne remplace ce que tu as écrit.</p>
        <p>Les grilles et les autres réponses sont conservées. Pour les brouillons plus anciens, l'objectif et le niveau visé sont réunis dans la réponse 2.</p>
        <p>Les anciennes sauvegardes restent sur cet appareil tant que tu ne réinitialises pas le carnet.</p>
        <button type="button" onClick={() => setMigration(false)}>Masquer ce message</button>
      </div> : null}

      <nav className="tabs" aria-label="Sections de l'auto-évaluation">
        {[...GRILLES.map((g) => ({ cle: g.cle, nom: g.nom })), { cle: "objectifs", nom: "Objectifs" }, { cle: "rapport", nom: "Rapport" }].map((item) => (
          <button key={item.cle} type="button" className={onglet === item.cle ? "active" : ""} aria-current={onglet === item.cle ? "page" : undefined}
            onClick={() => { setOnglet(item.cle); setMessage(""); }}>{item.nom}</button>
        ))}
      </nav>

      {grilleActive ? <section className="card grid-card">
        <div>
          <div className="section-heading"><h2>{grilleActive.nom}</h2><p>{grilleActive.sousTitre}</p></div>
          {grilleActive.domaines.map((d) => <BarreNiveau key={d} domaine={d} valeur={levels[grilleActive.cle]?.[d] ?? 0} disabled={busy}
            onChange={(value) => setNiveau(grilleActive.cle, d, value)} />)}
          <div className="legend">{NIVEAUX.map((n) => <span key={n.label}><i style={{ background: n.couleur, borderColor: n.bordure }} />{n.label}</span>)}</div>
        </div>
        <div className="interactive-radar"><RadarGrille grille={grilleActive} data={levels[grilleActive.cle]} /></div>
      </section> : null}

      {onglet === "objectifs" ? <section className="card">
        <div className="section-heading v5-objectives-title"><h2>Objectifs</h2></div>
        <div className="v2-progress" aria-live="polite">{GRILLES.map((g) => <div key={g.cle} className={`v2-progress-item${complets[g.cle] ? " complete" : ""}`}>
          <strong>{g.nom}</strong><span>{complets[g.cle] ? `${complets[g.cle]} objectif(s) complet(s)` : "Au moins 1 objectif à compléter"}</span>
        </div>)}</div>
        <form className="v2-form" noValidate onSubmit={allerAuRapport}>
          {sansCategorie.length ? <section className="v2-goal-section">
            <div className="v2-section-header"><h3>Anciens objectifs à classer</h3><p>Choisis une catégorie, puis complète les champs manquants.</p></div>
            {sansCategorie.map((o, i) => <FormulaireObjectif key={o.id} objectif={o} numero={i + 1} onChange={modifierObjectif} onDelete={supprimerObjectif}
              peutSupprimer disabled={busy} afficherErreurs={afficherErreurs} />)}
          </section> : null}
          {GRILLES.map((g) => {
            const liste = objectifs.filter((o) => o.categorie === g.cle);
            return <section className="v2-goal-section" key={g.cle} id={`objectifs-${g.cle}`}>
              <div className="v2-section-header"><h3 style={{ color: g.texteAccent }}>{g.nom}</h3><p>Au moins un objectif obligatoire</p></div>
              {liste.map((o, i) => <FormulaireObjectif key={o.id} objectif={o} numero={i + 1} onChange={modifierObjectif} onDelete={supprimerObjectif}
                peutSupprimer={liste.length > 1} disabled={busy} afficherErreurs={afficherErreurs} />)}
              <button className="secondary-button" type="button" disabled={busy || objectifs.length >= MAX_OBJECTIFS} onClick={() => ajouterObjectif(g.cle)}>Ajouter un objectif en {g.nom.toLowerCase()}</button>
            </section>;
          })}
          <div className="v2-stage-actions"><button className="primary-button" type="submit" disabled={busy}>Vérifier mon rapport</button></div>
        </form>
      </section> : null}

      {onglet === "rapport" ? <section className="card report-panel">
        <div className="section-heading"><h2>Rapport</h2><p>Le PDF contient ton nom, la date, les trois radars et tes réponses aux cinq questions, pour tous les objectifs regroupés par catégorie.</p></div>
        <div className="report-summary">{GRILLES.map((g) => <div key={g.cle} className="summary-item"><span>{g.nom}</span>
          <strong>{complets[g.cle]} objectif(s) complet(s)</strong><span>{g.domaines.filter((d) => levels[g.cle][d] > 0).length}/5 domaines explorés</span></div>)}
          <div className="summary-item"><span>Total</span><strong>{objectifs.length} objectif(s)</strong></div>
        </div>
        {erreurs.length ? <div className="v2-errors" role="status"><p>À compléter avant de préparer le PDF :</p><ul>{erreurs.map((e) => <li key={e}>{e}</li>)}</ul>
          <button type="button" className="text-button" onClick={() => { setAfficherErreurs(true); setOnglet("objectifs"); }}>Compléter mes objectifs</button>
        </div> : <p className="v2-ready">Le rapport est complet : au moins un objectif par catégorie et tous les champs renseignés.</p>}
        <div className="v7-share-instruction">Envoie ton PDF à Romain <strong>ET</strong> à Nathan</div>
        <div className="privacy-note">Le PDF est créé sur cet appareil. Aucun envoi automatique n'est effectué. Le brouillon reste dans ce navigateur jusqu'à réinitialisation.</div>
        {pdfCourant ? (
          <div className="v7-pdf-ready" role="status" aria-live="polite">
            <strong>Ton PDF est prêt.</strong>
            <span>{pdfCourant.nomFichier}</span>
            <small>{pdfCourant.pages} page{pdfCourant.pages > 1 ? "s" : ""} · A4 portrait</small>
          </div>
        ) : null}
        <div className="action-row">
          {!pdfCourant ? (
            <button className="primary-button" type="button" onClick={preparerPDF} disabled={busy || erreurs.length > 0}>
              {statut === "pdf" ? "Préparation du PDF…" : "Préparer mon PDF"}
            </button>
          ) : (
            <>
              <button className="primary-button" type="button" onClick={partagerPDF}
                disabled={busy || !partageDisponible || erreurs.length > 0} aria-describedby={!partageDisponible ? "v7-share-help" : undefined}>
                {statut === "sharing" ? "Partage en cours…" : "Partager le PDF"}
              </button>
              <button className="secondary-button" type="button" onClick={telechargerPDFPrepare} disabled={busy || erreurs.length > 0}>
                Télécharger le PDF
              </button>
            </>
          )}
          <button className="text-button" type="button" onClick={reinitialiser} disabled={busy}>Réinitialiser</button>
        </div>
        {pdfCourant && !partageDisponible ? <p id="v7-share-help" className="v7-share-help">Le partage de fichiers n'est pas disponible dans ce navigateur. Télécharge le PDF, puis joins-le à un message.</p> : null}
        {message ? <div className="status-message" role="status" aria-live="polite">{message}</div> : null}
      </section> : null}
      <RapportPDF reportRef={reportRef} nom={nom} date={date} levels={levels} objectifs={objectifs} />
    </main>
  );
}
