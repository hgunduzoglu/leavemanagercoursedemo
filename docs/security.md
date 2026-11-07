# Security

> Bootstrap 2026-11-07'de karara bağlandı. Agent'ların her planda ve review'da uyduğu temel kurallar.

## Secrets
- Secrets never enter the repo, specs, prompts, or chat. `.env` is gitignored; provide `.env.example`.
- Agents never print secret values, even when debugging.
- v1'de saklanacak bir sır yoktur: oturumlar sunucu tarafında tutulur, imzalama anahtarı gerekmez.
  Yapılandırma değişkeni gerekirse `.env.example` walking skeleton'da eklenir.
- Kurgusal demo kullanıcılarının seed parolaları **test fikstürüdür, sır değildir**; README'de
  "yalnızca yerel demo" olarak belirtilir. Gerçek bir parola asla seed verisine girmez.

## Input & output
- Her route'ta Fastify JSON Schema doğrulaması, `additionalProperties: false` — beklenmeyen alan reddedilir.
  API yalnızca `application/json` kabul eder.
- SQL **yalnızca parametreli sorgularla**; metin birleştirerek sorgu kurmak yasaktır.
- React çıktıyı escape eder; `dangerouslySetInnerHTML` yasaktır (lint ile zorlanır).
- Hata yanıtları içeriden bilgi sızdırmaz (`docs/conventions.md`, Error handling).
- Loglarda parola, parola hash'i ve oturum kimliği bulunmaz (Fastify logger `redact`).

## AuthN / AuthZ
**Kimlik doğrulama ("kim?") — `api` katmanı**
- E-posta + parola ile giriş. Parolalar Node'un yerleşik `node:crypto` **scrypt** fonksiyonuyla, kullanıcı
  başına rastgele salt ile hash'lenir.
- Oturum sunucu tarafında (SQLite); tarayıcıya yalnızca rastgele bir oturum kimliği gider:
  `HttpOnly`, `SameSite=Strict` cookie (`@fastify/cookie`).
- CSRF: `SameSite=Strict` + yalnızca `application/json` kabul eden API.
- **Varsayılan reddetme:** `/api/login` ve sağlık kontrolü dışındaki her route oturum ister; yoksa **401**.

**Yetkilendirme ("ne yapabilir?") — yalnızca `business` katmanı** (hassas alan, `docs/domain.md`)
- Çalışan yalnızca kendi taleplerini görür.
- Yönetici kendi taleplerini ve yalnızca doğrudan ekibinin taleplerini görür.
- Onay/red yalnızca doğrudan yöneticiye açıktır; kimse kendi talebine karar veremez (BR-7).
- İptal yalnızca talebi oluşturan çalışana ve yalnızca `Beklemede` durumunda açıktır (BR-9).
- Görme yetkisi olmayan kayıt → **404** (var olduğu sızmaz). Görebildiği ama üzerinde işlem yetkisi
  olmayan kayıt → **403**.
- Açıkça izin verilmeyen her işlem reddedilir.

## Dependencies
- Önce yerleşik modüller (`node:crypto`, `node:sqlite`).
- Her yeni bağımlılık (runtime veya dev) planda gerekçesiyle önerilir ve **plan onayında insan tarafından
  onaylanır**.
- Kabul koşulları: izin verici lisans (MIT, Apache-2.0, BSD, ISC) · son 12 ayda en az bir sürüm · eklendiği
  anda `npm audit`'te high/critical bulgu yok.
- `package-lock.json` commit'lenir.
- `npm audit` `scripts/check`'e konmaz: ağ gerektirir ve deterministik değildir (yeni bir CVE dünkü yeşil
  commit'i kırmızıya çevirir). Bağımlılık eklenirken plan aşamasında çalıştırılır.

## Review lens
Security is a mandatory dimension of every independent review (see `prompts/review.md`), not a
separate afterthought phase.
