---
created: 2026-06-11T13:39:33.571Z
title: Impressum per Verweis auf compoundingknowledge.com lösen
area: legal
files: []
---

## Problem

LEGL-01 (Phase 1) verlangt Impressum + Datenschutzerklärung vor jeder öffentlichen URL. Der Betreiber hat bereits ein Impressum auf www.compoundingknowledge.com und möchte die Adressdaten nicht duplizieren.

Per §5 DDG muss das Impressum "leicht erkennbar, unmittelbar erreichbar und ständig verfügbar" sein — ein klar beschrifteter Link vom Spiel auf das externe Impressum ist nach gängiger Rechtsprechung zulässig (max. zwei Klicks), WENN das Ziel-Impressum die Spiel-Domain ausdrücklich mit abdeckt.

## Solution

Bei Umsetzung von LEGL-01 in Phase 1:

1. Footer-/Settings-Link "Impressum" im Spiel → zeigt auf das Impressum von www.compoundingknowledge.com
2. **Manueller Schritt für den Betreiber:** Auf compoundingknowledge.com im Impressum einen Geltungssatz ergänzen, z.B. "Dieses Impressum gilt auch für [Spiel-Domain]" — ohne diesen Satz ist der Verweis angreifbar
3. Datenschutzerklärung NICHT nur verlinken: Das Spiel braucht eine eigene Datenschutz-Seite, die die konkrete Verarbeitung beschreibt (Supabase Cloud-Save, Brevo E-Mail/Double-Opt-in, cookieloses Analytics, IndexedDB-Speicherung)
4. Beide Links aus Footer UND Settings/Pause-Menü erreichbar (LEGL-01)

Hinweis: Recherche-Wissen, keine Rechtsberatung. Bei der Phase-1-Planung berücksichtigen (gsd-plan-phase 1).
