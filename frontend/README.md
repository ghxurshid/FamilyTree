# Shajara — oila daraxti (React + Vite + TypeScript)

Interaktiv shajara ilovasining frontendi. Dizayn manbasi — `_design/v1/`
(Nocturne dizayn tizimi + `Shajara.dc.html`). Backend hali yo'q: servis qatlami
mock amalga oshirish bilan ishlaydi, interfeyslar esa real API uchun tayyor.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
```

Boshqa buyruqlar:

```bash
npm run typecheck  # tsc -b
npm run lint       # eslint
npm run build      # tsc -b && vite build
npm run preview    # yig'ilgan versiyani ko'rish
```

## Muhit o'zgaruvchilari

`.env.example` faylidan nusxa oling:

| O'zgaruvchi | Ma'nosi |
| --- | --- |
| `VITE_API_BASE_URL` | Backend manzili (mock rejimda ishlatilmaydi) |
| `VITE_USE_MOCK_API` | `true` — mock servislar, `false` — HTTP servislar |
| `VITE_MOCK_LATENCY` | Mock javoblarining kechikishi (ms) |

## Manzillar

| Manzil | Ekran |
| --- | --- |
| `/` | `/tree` ga yo'naltiradi |
| `/tree` | Shajara kanvasi. `?person=<id>` — chuqur havola |
| `/people` | Odamlar katalogi |
| `/profile` | "Mening oilam" (kirish talab qilinadi) |
| `/settings` | Sozlamalar |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Autentifikatsiya |

Shajarani kirishsiz ham ko'rish mumkin — tahrirlash uchun kirish kerak.

## Klaviatura

| Tugma | Amal |
| --- | --- |
| `/` | Qidiruv |
| `Esc` | Ochiq oyna/panelni yopish |
| `↑ ↓` (qidiruvda) | Natijalar orasida yurish, `Enter` — tanlash |
| `↑ ↓ ← →` (daraxtda) | Ota / farzand / aka-uka orasida yurish |
| `+` `-` | Kattalashtirish / kichraytirish |
| `0` | O'zingizga qaytish |
| `F` | Butun daraxt |

## Struktura

```
src/
├── app/          # config, router, layout, providers
├── components/   # ui, layout, family-tree, person, search
├── features/     # domen mantig'i: auth, family-tree, people
│   └── family-tree/lib/   # toza funksiyalar: layout, relations, permissions, search
├── pages/        # ekranlar
├── services/     # servis qatlami (mock + REST), mappers, storage
├── stores/       # createStore ustidagi holat
├── hooks/  types/  constants/  utils/  styles/
```

Muhim qoidalar:

- Komponentlar `fetch` chaqirmaydi — faqat `services/` orqali.
- Daraxt algoritmlari (joylashuv, qarindoshlik, huquq, qidiruv) React'dan
  mustaqil toza funksiyalar — alohida sinaladi.
- Frontend huquqlari faqat UX uchun; haqiqiy ruxsatni backend beradi.

## Ma'lumot

Mock ma'lumot — `src/services/mock/data/family-data.json`: haqiqiy shajara
(590 a'zo, 13 avlod). Tug'ilgan yil, kasb, shahar va biografiya maydonlari
ataylab bo'sh — ular oila a'zolari tomonidan to'ldiriladi va ilova bo'sh
holatlarni shunga qarab ko'rsatadi.
