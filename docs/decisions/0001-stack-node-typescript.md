# ADR 0001 — Stack: Node.js 24 LTS, TypeScript, Fastify, React + Vite, node:sqlite, Vitest

- Status: Accepted
- Date: 2026-11-07

## Context
İzin Yöneticisi, ANEW sürecini gösteren greenfield bir kurs demosu. İhtiyaçlar: kurs izleyicisinin
tanıdığı tek bir dil, UI kriterlerinin bileşen testiyle kanıtlanabilmesi (`docs/testing.md`), geride
süreç bırakmayan bir `scripts/check` (Resource hygiene), Windows'ta geliştirme ve Linux'ta CI. Bootstrap
sırasında makinede Node.js 24, Python 3.13 ve .NET 10 kuruluydu. Karar bootstrap röportajında
(2026-11-07) insan tarafından verildi; bu ADR onu ve walking skeleton'da (spec 0001) netleşen
ayrıntıları kaydeder.

## Decision
Tek bir npm paketinde **Node.js 24 LTS + TypeScript 5.9** (strict), API için **Fastify 5**, arayüz için
**React 19 + Vite**, veritabanı için Node'un yerleşik **`node:sqlite`** modülü, testler için **Vitest**
(+ React Testing Library, jsdom). Sunucu, TypeScript'i Node'un yerleşik type stripping'i ile derleme
adımı olmadan çalıştırır. Sürümler `package.json`'da `--save-exact` ile sabittir.

## Consequences
- **Kazanç:** UI, API ve iş kuralları tek dilde. Bileşen testleri UI durumlarını doğrudan kanıtlar;
  `fastify.inject()` port açmadan test eder; her test bellek içi SQLite açtığı için veri hijyeni
  kendiliğinden sağlanır. `node:sqlite` native derleme gerektirmez. Sunucu için `tsx` ya da derleme
  adımı yoktur.
- **Bedel:** Göreli importlar `.ts` uzantısı taşır ve yalnızca silinebilir TS sözdizimi kullanılır
  (`enum`, `namespace` yok; `tsconfig.json`: `allowImportingTsExtensions`, `erasableSyntaxOnly`).
  `node:sqlite` hâlâ deneysel: `ExperimentalWarning` basar, API değişebilir (yalnızca `src/data`
  kullanır). TypeScript 5.9'da tutuldu, çünkü `typescript-eslint` 8.72 TS 7'yi desteklemiyor (`<6.1`).
  Node 24, 2026-10'dan beri bakım LTS'sinde (etkin LTS: 26). Kurulumda `npm audit`: high/critical 0;
  yalnızca lint zincirinde (`minimatch` üzerinden) dev'e özel 10 moderate bulgu var.

## Alternatives considered
- **Python 3.13 + FastAPI + Jinja2/htmx + pytest:** Kaynak hijyeni en kolay olan seçenekti. Kaybetti,
  çünkü UI kriterleri bileşen testi yerine HTML çıktısı üzerinden kanıtlanacaktı ve kurs izleyicisi için
  React daha tanıdık.
- **.NET 10 + ASP.NET Core + Razor Pages + xUnit:** Güçlü tipler sağlıyordu. Kaybetti, çünkü MSBuild
  node'ları ve VBCSCompiler her check'te ayrıca kapatılmalı; daha ağır bir araç zinciri.
- **`better-sqlite3`:** Olgun bir kütüphane, ama Windows'ta native derleme riski taşıyor;
  `node:sqlite` yerleşik.
- **Sunucu için `tsx` / derleme adımı:** Ek bağımlılık ve adım getiriyordu; Node 24'ün type stripping'i
  yeterli (spec 0001'in duman testinde doğrulandı).

## Revisit triggers
- `node:sqlite` API'sinde kıran bir değişiklik ya da kararlı hâle gelmesi.
- `typescript-eslint`'in TypeScript 7'yi desteklemesi.
- Node 24 bakımının sonu (2028-04-30) yaklaşırken, ya da bir bağımlılık Node 26 isterse.
- Üretime dağıtım kapsama girerse (sunucu derlemesi, statik servis).
