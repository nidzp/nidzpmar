# NIDZP Marketing — Final Strike public mirror

Ovaj repozitorijum sadrži javni, statički Final Strike build NIDZP Marketinga:

- `/sales/` — prodajni pregled sa paketima Sajt 600 EUR i Premium sa Ninom 2.500 EUR godišnje;
- `/demo/<delatnost>/paket-1` i `/demo/<delatnost>/paket-2` — 30 delatnosti i 60 demo prikaza;
- `vercel.json` — Vercel konfiguracija koja javni `/api/*` prosleđuje postojećem Netlify servisu, dok Netlify sajt ostaje aktivan;
- svi poslovni podaci u ovom javnom buildu su sintetički demo podaci i označeni su kao NIDZP DEMO.

Izvorni engine i build komande nalaze se u lokalnom projektu `NIDZP_DEMO_ENGINE`. Ovaj repozitorijum je namerno deploy paket: ne sadrži `.env`, API ključeve, privatne radne podatke, `node_modules` ni lokalne baze.

## Lokalna provera

Za pregled bez build koraka posluži statički koren ovog repozitorijuma. Kanonične provere izvornog engine-a ostaju:

```powershell
npm run test:final-strike
npm run test:admin
npm run build:sve
npm run build:final-strike
```

Javni pregled je demonstracija i nije stvarna ponuda konkretnog lokala.
