# Design System: Handball Dashboard (Shadcn-Inspired)

Dieses Projekt nutzt ein maßgeschneidertes Design-System, das auf der **Shadcn UI** Ästhetik basiert. Es verwendet die **Zinc** Farbpalette und setzt konsequent auf HSL-Variablen für maximale Flexibilität (inkl. Dark Mode).

## 🎨 Farbpalette (Zinc)

Die Farben werden über CSS-Variablen gesteuert und ändern sich automatisch im Dark Mode.

| Variable | Beschreibung | Light Mode (HSL) | Dark Mode (HSL) |
| :--- | :--- | :--- | :--- |
| `--background` | Hintergrund der Seite | `0 0% 100%` | `240 10% 3.9%` |
| `--foreground` | Haupttextfarbe | `240 10% 3.9%` | `0 0% 98%` |
| `--card` | Hintergrund von Karten/Panels | `0 0% 100%` | `240 10% 3.9%` |
| `--primary` | Primärfarbe (Buttons/Highlights) | `240 5.9% 10%` | `0 0% 98%` |
| `--muted` | Dezentere Hintergründe | `240 4.8% 95.9%` | `240 3.7% 15.9%` |
| `--destructive` | Fehler/Löschen-Aktionen | `0 84.2% 60.2%` | `0 62.8% 30.6%` |
| `--border` | Rahmenfarbe | `240 5.9% 90%` | `240 3.7% 15.9%` |

## 🧩 Komponenten

### Buttons (`.shadcn-btn-*`)
Standardisierte Buttons mit konsistentem Padding (`0 1rem`), Höhe (`2.5rem`) und Radius (`0.5rem`).

- `shadcn-btn-primary`: Hauptaktion (nutzt oft Team-Farbe).
- `shadcn-btn-secondary`: Sekundäre Aktionen.
- `shadcn-btn-outline`: Umrandete Buttons für weniger Fokus.
- `shadcn-btn-ghost`: Text-Buttons ohne Hintergrund (Hover-Effekt).
- `shadcn-btn-destructive`: Rote Buttons für Gefahrenzonen.

### Inputs & Selects (`.shadcn-input`)
- Abgerundeter Radius (`var(--radius)`).
- Subtile Rahmenfarbe (`var(--input)`).
- Fokus-Ring (`var(--ring)`) mit 30% Opazität.

### Karten (`.content-section`, `.stats-card`)
- Weißer Hintergrund (Light) oder Dunkel-Zinc (Dark).
- Subtiler Schatten (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
- Konsistentes Padding von `1.5rem`.

### Glassmorphism Action Buttons
```css
.action-btn {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

### Switches (`.shadcn-switch`)
- Animierte Toggle-Schalter im Shadcn-Stil.
- Nutzt `data-state="checked"` für den Zustand.

### Aktions-Farben (Live-Dashboard)
Diese Farben werden im Live-Dashboard verwendet, um schnelle Reaktionen zu ermöglichen. Sie basieren auf der Tailwind-Farbpalette und nutzen HSL-Variablen für Dark-Mode Support.

| Aktion | Variable | Farbe (Light) | Farbe (Dark) |
| :--- | :--- | :--- | :--- |
| **TOR** | `--action-goal` | Green 600 | Green 700 |
| **GEHALTEN** | `--action-save` | Violet 600 | Violet 500 |
| **FEHLWURF** | `--action-post` | Blue 500 | Blue 500 |
| **GEBLOCKT** | `--action-lost` | Cyan 600 | Cyan 700 |
| **GELB** | `--action-yellow`| Yellow 500 | Yellow 400 |
| **ROT** | `--action-red` | Red 600 | Red 500 |
| **BLAU** | `--action-blue` | Blue 500 | Blue 500 |

## 🟢 Icons (Lucide)

Das Projekt nutzt **Lucide Icons** über das `data-lucide` Attribut.

**Häufig genutzte Icons:**
- `layout-dashboard`: Überblick
- `calendar`: Kalender / Termine
- `users`: Kader / Spieler
- `trash-2`: Löschen
- `settings`: Einstellungen
- `play-circle`: Spiel-Aktionen
- `crosshair`: Wurfbilder
- `check-circle`: Erfolg / Bestätigung
- `alert-circle`: Warnung / Fehler

## 🛠️ Design-Prinzipien
1. **Typografie**: Verwendung von "Inter" als Hauptschriftart für beste Lesbarkeit.
2. **Abstände**: Nutzung von rem-Einheiten für konsistente White-Space.
3. **Interaktion**: Sanfte Transitions (`0.2s`) für Hover- und Fokus-Zustände.
4. **Dark Mode**: Vollständige Unterstützung durch CSS-Variablen-Mapping.
