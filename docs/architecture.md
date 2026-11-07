# Architecture

> Bootstrap 2026-11-07'de karara bağlandı. Agent'lar planlamadan önce bu dosyayı okur.

## System overview
İzin Yöneticisi, tek bir Node.js sürecinde çalışan **n-katmanlı (layered)** bir web uygulamasıdır.
React SPA (`web`) sunucuyla yalnızca `/api` altındaki HTTP/JSON üzerinden konuşur. Sunucu tarafında
`api` → `business` → `data` katmanları yukarıdan aşağıya çağrılır; `shared` katmanlar arasında taşınan
tipleri tutar. Tek bir npm paketi ve tek bir SQLite veritabanı (`node:sqlite`) vardır. Gerekçe: bu
kapsamda servis ayırmak yalnızca maliyet getirir; klasik katmanlar kurs izleyicisi için tanıdıktır ve
katman sınırları lint ile zorlanır. Kararlar: ADR 0001 (stack) ve ADR 0002 (n-katmanlı mimari),
`docs/decisions/`.

## Modules / components and ownership

Her katman `src/` altında bir klasördür (yukarıdan aşağıya):

| Module | Single responsibility | Owns |
|---|---|---|
| `src/web` (Sunum) | React arayüzü; sunucuyla yalnızca `/api` altındaki HTTP/JSON üzerinden konuşur. Kontrolleri yalnızca kullanıcı deneyimi içindir. | UI durumu |
| `src/api` (API) | Fastify route'ları, girdi doğrulama (JSON Schema), oturum / kimlik doğrulama ("kim?"), `BusinessError` → HTTP eşlemesi (tek merkezi hata yakalayıcı). İş kuralı içermez. | API yüzeyi |
| `src/business` (İş) | İş kuralları (BR-1…BR-10), iş günü ve bakiye hesabı, durum geçişleri, use case'ler, transaction sınırı. **Yetkilendirme (BR-7, BR-9) yalnızca burada, varsayılan reddetmeyle.** | İş akışı ve kurallar |
| `src/data` (Veri erişimi) | SQLite (`node:sqlite`) bağlantısı, şema/migration'lar, seed verisi, repository'ler. | Tablolar ve SQL |
| `src/shared` (Ortak) | Katmanlar arasında taşınan tipler: entity tipleri ve API istek/yanıt DTO'ları. | Tipler |

**Composition root:** `src/server.ts` — uygulamayı ayağa kaldıran ve katmanları birbirine bağlayan tek
yer. "Bugün"ü veren saati (Europe/Istanbul) iş katmanına buradan verir. Her şeyi import etmesine yalnızca
burada izin verilir.

## Communication rules
- Sunucu içinde katmanlar **doğrudan fonksiyon çağrısıyla** konuşur; her katman yalnızca hemen altındaki
  katmanı çağırır. Event bus, kuyruk veya arka plan işi yoktur.
- `web` ↔ sunucu: yalnızca `/api` altındaki HTTP/JSON. Sözleşme tipleri `src/shared` içindedir.
- Sunucu, iş kurallarının **tek otoritesidir**. UI'daki bir kontrol, sunucudaki kontrolün yerine geçmez.
- Geliştirmede SPA'yı Vite dev server sunar ve `/api` isteklerini Fastify sunucusuna yönlendirir
  (`vite.config.ts`, `src/server.ts` ile aynı `HOST`/`PORT`). Üretim derlemesi (`dist/`) `check`'te
  doğrulanır; bir sunucudan servis edilmesi ve dağıtım kapsam dışıdır (spec 0001).

## Forbidden dependencies (make them testable)
`scripts/check`'in lint adımında, klasör başına ESLint `no-restricted-imports` kurallarıyla zorlanır
(ek paket yok). Muaf olan tek dosya composition root'tur (`src/server.ts`).

1. **Yukarı doğru bağımlılık yok:** `data` → `business` / `api` / `web` yasak; `business` → `api` / `web` yasak.
2. **Katman atlanmaz:** `api`, `data`'yı import edemez; her zaman `business` üzerinden geçer.
3. **`web` yalnızca `shared`'ı import eder;** `api`, `business`, `data` ona kapalıdır.
4. **`business` HTTP/framework tipi (`fastify`) import etmez** ve doğrudan `new Date()` / `Date.now()`
   çağırmaz; saat dışarıdan verilir.
5. **`shared` hiçbir katmanı import etmez.**

## Deliberately out of scope
- **Teknik:** mikroservisler, mesaj kuyruğu, önbellek, çoklu kiracı (multi-tenant), yatay ölçekleme,
  harici kimlik sağlayıcı, hız sınırlama (rate limiting), üretime dağıtım.
- **Ürün (v1):** resmi tatiller, yarım gün izin, birden fazla izin türü (hastalık, ücretsiz…), bakiye devri,
  onaylanmış talebin iptali, admin paneli (kullanıcılar ve yıllık haklar seed verisiyle gelir),
  bildirimler (e-posta vb.), i18n (arayüz yalnızca Türkçe).
