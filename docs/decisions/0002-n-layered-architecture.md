# ADR 0002 — N-katmanlı mimari, lint ile zorlanan katman kuralları

- Status: Accepted
- Date: 2026-11-07

## Context
Uygulama küçük ve tek ekipli; kurs izleyicisinin mimariyi hızla kavraması gerekiyor. Bootstrap'ta port ve
adapter'lı bir modüler monolit önerildi. İnsan bunu bu boyut için gereksiz buldu ve klasik n-katmanlı yapıyı
seçti (bootstrap röportajı, 2026-11-07). Yetkilendirme hassas alan (`docs/domain.md`) olduğu için tek bir
katmanda toplanmalı. Kurallar düzyazıda kalırsa zamanla aşınır.

## Decision
`src/` altında beş klasör: `web` → (HTTP `/api`) → `api` → `business` → `data`; katmanlar arası tipler
`shared`'da. Her katman yalnızca hemen altındakini çağırır. Katmanları birbirine yalnızca composition root
(`src/server.ts`) bağlar. Beş yasak bağımlılık (`docs/architecture.md`) ESLint'te klasör başına
`no-restricted-imports` ile, iş katmanındaki saat yasağı `no-restricted-syntax` ile zorlanır; her kuralın
çalıştığını `src/layer-rules.test.ts` kanıtlar.

## Consequences
- **Kazanç:** Basit ve tanıdık bir yapı. Yetkilendirme tek yerde (`business`) toplanıyor. Kurallar araçla
  zorlanıyor ve testle kanıtlanıyor; ek paket gerekmiyor.
- **Bedel:** `business`, `data`'ya doğrudan bağlı (bağımlılık tersine çevrilmiyor). Bu yüzden iş katmanı
  testleri sahte nesneler yerine gerçek bellek içi SQLite kullanır. API testleri `data`'yı import edemez;
  servisin yerine elle yazılmış küçük bir nesne geçer, gerçek veritabanı yolunu iş katmanı testleri ve
  duman testi kanıtlar. Depolama değişirse iş katmanı da değişir.

## Alternatives considered
- **Port/adapter'lı modüler monolit:** Bağımlılığı tersine çeviriyordu. Bootstrap'ta reddedildi: bu boyut
  için gereksiz tören ve kurs izleyicisi için ek kavram yükü.
- **Mikroservisler:** Ayrı dağıtım ve ağ getiriyordu. Kapsam dışı; tek ekip ve küçük uygulama için
  yalnızca maliyet.

## Revisit triggers
- İkinci bir depolama ya da harici bir sistem (bildirim, İK sistemi) entegrasyonu.
- Gerçek SQLite yüzünden iş katmanı testlerinin yavaşlaması (`--fast` profili ~1 dakikayı aşarsa).
- Özelliklerin birbirinden bağımsız modüllere ayrılma ihtiyacı.
