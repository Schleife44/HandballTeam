# Sechsmeter Design System

Dieses Dokument definiert die visuelle Sprache und die Design-Prinzipien der **Sechsmeter** Plattform. Jede neue Komponente und jedes neue Feature muss sich strikt an diese Richtlinien halten, um den professionellen, aggressiven und hochperformanten Look zu bewahren.

## 1. Farbpalette (Toxic Neon & Deep Void)

Das Design basiert auf einem extremen Kontrast zwischen einem tiefen Schwarz und einem leuchtenden, "giftigen" Grün.

| Farbe | HEX | Tailwind / CSS | Verwendung |
| :--- | :--- | :--- | :--- |
| **Brand Green** | `#84cc16` | `brand` | Primärfarbe, Buttons, Highlights, Live-Status |
| **Brand Dark** | `#65a30d` | `brand-dark` | Hover-States, Gradients |
| **Brand Light** | `#bef264` | `brand-light` | Subtile Akzente, Icons |
| **Deep Void** | `#000000` | `black` | Seitenhintergrund (Body) |
| **Card Zinc** | `#18181b` | `zinc-900` | Kartenhintergründe (mit Alpha: `/50`) |
| **Border Zinc** | `#27272a` | `zinc-800` | Standard-Rahmen |
| **Muted Text** | `#71717a` | `zinc-500` | Meta-Informationen, Labels |

## 2. Typografie (Aggressive & Bold)

Wir verwenden Typografie nicht nur zum Lesen, sondern als Design-Statement.

- **Schriftart:** `Inter`, system-ui (San-Serif)
- **Gewichtung:** Primär `font-black` (900) oder `font-bold` (700)
- **Headlines:** Immer **UPPERCASE** und **ITALIC**.
- **Tracking:** Weite Buchstabenabstände für Labels (`tracking-[0.3em]` oder `tracking-widest`).
- **Tabular Nums:** Für Spielstände und Timer immer `tabular-nums` verwenden, um Jitter zu vermeiden.

## 3. Formsprache (Organic & Professional)

Die Formen sind massiv und modern.

- **Border Radius:**
  - Standard Cards: `rounded-3xl` (24px)
  - Große Bereiche: `rounded-[2rem]` oder `rounded-[3rem]`
  - Buttons/Icons: `rounded-xl` oder `rounded-2xl`
- **Backdrop:** Karten verwenden fast immer `backdrop-blur-sm` oder `backdrop-blur-md` in Kombination mit `bg-zinc-900/50`.
- **Glow-Effekte:** Akzente werden oft durch Box-Shadows mit der Brand-Farbe gesetzt: `shadow-[0_0_20px_rgba(132,204,22,0.15)]`.

## 4. Interaktion & Animation (Tactile Feedback)

Das Interface muss sich "lebendig" anfühlen.

- **Hover-States:** 
  - Skalierung: `hover:scale-[1.02]` oder `hover:scale-[1.03]`
  - Translation: `hover:-translate-y-0.5`
  - Border: Übergang von `zinc-800` zu `brand/30` oder `brand/50`.
- **Active-States:** Immer ein haptisches Feedback geben: `active:scale-95`.
- **Transitions:** Weiche Übergänge für alle Properties: `transition-all duration-300 ease-in-out`.
- **Live-Status:** Pulsierende Animationen für aktive Events (`animate-pulse`).

## 5. UI-Komponenten Muster

### Karten (Hub-Cards)
```jsx
<div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-sm shadow-xl p-6">
  {/* Content */}
</div>
```

### Buttons (Sechsmeter Style)
- **Primary:** Hintergrund Brand-Green, Text Schwarz, starker Glow.
- **Outline:** Rahmen Zinc-800, Text Zinc-500, Hover Text Weiß & Rahmen Zinc-500.
- **Ghost:** Text Zinc-500, Hover Hintergrund Zinc-800/50 & Text Weiß.

## 6. Goldene Regeln
1. **Kein reines Grau:** Nutze immer die `zinc`-Skala für Tiefe.
2. **Icons:** Verwende `lucide-react`. Icons sollten meist `strokeWidth={2.5}` haben, um zum fetten Design zu passen.
3. **Leerraum:** Mut zum Platz. Große Paddings (`p-8`, `p-10`) lassen das Design atmen und wirken hochwertiger.
4. **Keine harten Kanten:** Alles Interaktive oder Container-basierte ist abgerundet.
