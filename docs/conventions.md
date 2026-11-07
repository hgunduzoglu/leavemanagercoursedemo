# Conventions

> Bootstrap 2026-11-07'de karara bağlandı. Yalnızca gerçek kurallar: her kural ya araçla zorlanır
> (tercih edilen) ya da review'da kontrol edilir.

## Language
<!-- Set at bootstrap (step 0) and mirrored in AGENTS.md. Changing it later is allowed — edit both
     places; existing documents are not translated retroactively. -->
- Chat language (interviews, sessions): Türkçe (`tr`)
- Document language (docs/, specs, plans, ADRs, review and verify reports): Türkçe (`tr`)
- Always English (protocol, not prose): ANEW core files, template headings and field labels,
  `Status:` values (Draft / Approved / In progress / Shipped), `Approved by / on:`, `Source:`.
- Code identifiers, branch names, commit messages: İngilizce. Türkçe domain terimlerinin kod
  karşılıkları `docs/domain.md` tablosundadır (Çalışan = `Employee`).
- Uygulama arayüzü metinleri: Türkçe. i18n kütüphanesi yoktur.
- Agent messages (handoff summaries, refusals, `Next:` lines): chat language; command names, file
  paths and protocol fields verbatim.

## Language & framework versions
- **Node.js 24 LTS** — `package.json` `engines: { "node": ">=24" }`; `scripts/check.conf` bir `requires`
  satırıyla ana sürümün 24 olduğunu doğrular.
- **TypeScript 5.x**, `strict: true`, ES modülleri.
- **Fastify 5** (API) · **React 19** + **Vite** (SPA) · **SQLite** Node'un yerleşik `node:sqlite` modülüyle.
- **Vitest** + React Testing Library + jsdom · **ESLint 9** (flat config) · **Prettier**.
- Tam sürümler walking skeleton'da güncel kararlı sürümlere sabitlenir; `package-lock.json` commit'lenir.

## Naming

| Ne | Kural | Örnek |
|---|---|---|
| TS modülleri | kebab-case | `leave-request.ts` |
| React bileşenleri | PascalCase | `LeaveRequestForm.tsx` |
| Testler | Kodun yanında, `*.test.ts(x)` | `balance.test.ts` |
| Fonksiyon / değişken · tip | camelCase · PascalCase | `availableBalance` · `LeaveRequest` |
| Veritabanı tablo/kolon | snake_case | `leave_requests.start_date` |
| API yolları · JSON alanları | çoğul kebab-case · camelCase | `/api/leave-requests` · `startDate` |
| Branch adları | `docs/git.md` "Branching" | `feature/0002-create-request` |

## Error handling
1. `api` girdiyi Fastify'ın yerleşik JSON Schema doğrulamasıyla kontrol eder; hatalı girdi → **400**.
2. `business` kural ihlalinde sabit kodlu bir `BusinessError` fırlatır: `INSUFFICIENT_BALANCE`,
   `OVERLAPPING_REQUEST`, `INVALID_STATE`, `FORBIDDEN`, `NOT_FOUND` vb.
3. `api`'deki **tek merkezi hata yakalayıcı** kodu HTTP durumuna çevirir: 401 oturum yok · 403 yetki yok
   · 404 bulunamadı (veya görme yetkisi yok — `docs/security.md`) · 409 çakışma / geçersiz durum geçişi
   · 422 iş kuralı ihlali · 500 beklenmeyen hata.
4. Yanıt gövdesi her zaman `{ "error": { "code": "...", "message": "..." } }`; `web` kodu Türkçe kullanıcı
   mesajına çevirir.
5. **Kullanıcıya asla sızmaz:** stack trace, SQL hataları, iç dosya yolları. Bunlar yalnızca sunucu
   loguna gider; 500 yanıtı her zaman genel bir mesaj taşır.

## Data rules
- **İzin tarihleri saatsiz takvim tarihidir:** uçtan uca `YYYY-MM-DD` metni, SQLite'ta `TEXT`. İzin
  tarihleri için JS `Date` nesnesi kullanılmaz (saat dilimi kayması bir günü kaydırır).
- **Zaman damgaları** (`createdAt`, `decidedAt`): UTC, ISO 8601.
- **"Bugün"** Europe/Istanbul saat dilimine göre, yalnızca saat bileşeninde (`Clock`) hesaplanır.
- **Gün sayıları** tam sayıdır; yalnızca tam gün.
- **ID'ler** SQLite `INTEGER PRIMARY KEY`.
- **Durum** değerleri `Pending | Approved | Rejected | Cancelled` metinleri; veritabanında `CHECK` kısıtı.
- **Eşzamanlılık:** bakiye ve çakışma kontrolü (BR-5, BR-6) ile talebin yazılması tek bir
  `BEGIN IMMEDIATE` transaction'ı içinde yapılır; aynı anda gelen iki talep bakiyeyi aşamaz.
- **SQL** yalnızca parametreli sorgularla yazılır (`docs/security.md`).

## Known traps
<!-- Starts empty. One line per trap of this stack that a builder can know up front:
     "<trap> — <what to do instead> — from <spec/finding>". A line is added when triage marks a
     finding real and the reviewer says a build-time rule would have caught it; the human
     approves it at triage as Amendment A-n and the Developer writes it in the fix round.
     Builders read this section before the first plan step.
     A trap that tooling can catch moves to "Enforced by tooling" instead. -->
- `new Date("2026-11-07").getDay()` UTC gece yarısı olarak ayrıştırır, yerel saatle gün kayar — hafta gününü `getUTCDay()` ile veya tarih metninden saf aritmetikle hesapla — from bootstrap 2026-11-07
- SQLite'ta foreign key'ler varsayılan olarak kapalıdır — her bağlantıda `PRAGMA foreign_keys = ON` (`data` katmanındaki bağlantı fabrikası) — from bootstrap 2026-11-07
- `node:sqlite` Node 24'te deneysel: `ExperimentalWarning` basar, API değişebilir — yalnızca `data` katmanında kullan, uyarıyı global olarak susturma — from bootstrap 2026-11-07
- `vitest` (`run` olmadan) terminalde izleme moduna girer ve kapanmaz — `check` ve npm script'lerinde her zaman `vitest run` — from bootstrap 2026-11-07
- `fastify.inject()` testlerinde uygulama kapatılmazsa veritabanı/hook tanıtıcıları açık kalır — her testin sonunda `await app.close()` — from bootstrap 2026-11-07
- Windows `cmd` altında `TZ=UTC vitest run` gibi npm script'leri çalışmaz — `TZ` ve locale'i `vitest.config.ts` içinde sabitle — from bootstrap 2026-11-07

## Enforced by tooling
<!-- List what the compiler/linter/analyzers already enforce, so review doesn't re-litigate it.
Wire new rules into `scripts/check` whenever possible — prose is advice, tooling is law. -->
Planlandı; walking skeleton `scripts/check.conf` adımlarıyla birlikte etkinleştirir:
- `tsc --noEmit` — `strict: true` tip denetimi.
- ESLint — `@typescript-eslint/no-explicit-any` (hata); katman kuralları (`docs/architecture.md`,
  Forbidden dependencies) `no-restricted-imports` ile; `dangerouslySetInnerHTML` yasağı
  `no-restricted-syntax` ile.
- Prettier `--check` — biçimlendirme.
