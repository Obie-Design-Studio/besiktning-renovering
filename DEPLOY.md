# Production (Vercel) — miljövariabler och inloggning

## 1. Environment Variables (obligatoriskt)

**Vercel → Project → Settings → Environment Variables**

Lägg till för **Production** (och Preview om du vill):

| Variabel | Beskrivning |
|----------|-------------|
| `IDENTITY_TOKEN_TOBIAS` | Samma hemliga sträng som du använder efter `?token=` i URL:en. |
| `IDENTITY_TOKEN_PALMENS` | Om du använder Palmens-inloggningslänk. |
| `IDENTITY_TOKEN_BESIKTNINGSMAN` | Om du använder besiktningsmans-länk. |

Övriga nycklar finns i [`.env.example`](./.env.example) (Supabase, `GOOGLE_AI_API_KEY`, …).

## 2. Redeploy

Efter att du sparat env-variabler: **Redeploy** projektet (eller trigga en ny deployment från `main`), annars kör den gamla builden utan rätt värden.

## 3. Testa token-inloggning (inkognito)

1. Öppna ett **inkognito**-fönster.
2. Gå till:
   ```text
   https://besiktning-renovering.vercel.app/?token=DITT_TOKEN_VÄRDE
   ```
   Byt `DITT_TOKEN_VÄRDE` mot **exakt** samma sträng som `IDENTITY_TOKEN_TOBIAS` i Vercel.

3. Efter redirect: **DevTools → Application → Cookies** för sajten — du ska se cookien **`idn`** (t.ex. värdet `Tobias`).

4. Då fungerar bl.a. **„Markera sektion klar”** (och röda räknare för den sektionen kan stängas av när du markerar sektionen klar).

## 4. Felsökning

- **`idn` dyker aldrig upp:** värdet i URL:en matchar inte `IDENTITY_TOKEN_TOBIAS` i Vercel (stavfel, mellanslag, gammal deployment). Uppdatera env och **redeploy**.
- **Snabb kontroll utan DevTools:** öppna [`/api/identity-health`](/api/identity-health) på den deployade sajten — JSON visar `true`/`false` per typ av nyckel (inga hemligheter visas).
