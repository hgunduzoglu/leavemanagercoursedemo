# Spec 0001 — Walking skeleton

- Status: Shipped
- Mode: lite
- Plan: `specs/plans/0001-plan.md`
- Self-critique: done

## Intent
Kurs eğitmeni (geliştirici) ve izleyiciler, İzin Yöneticisi'nin ilk izin özelliğine başlamadan önce
uçtan uca çalışan **en küçük dilimi** istiyor: tarayıcıda açılan ana sayfa, sistemin ve veritabanının
çalışıp çalışmadığını gösterir ve bu bilgi sunumdan veriye kadar bütün katmanlardan geçerek gelir.
Başarı şöyle görünür: `./scripts/check` artık gerçek adımlarla (tip denetimi, lint, biçim, test,
derleme) yeşil, CI her push'ta aynı full profili çalıştırıyor ve sonraki her özellik bu iskeletin
üzerine yalnızca kendi davranışını ekliyor. Bilinçli olarak **yapılmayanlar**: hiçbir izin özelliği,
giriş/oturum, izin verileri için şema ve seed verisi, üretime dağıtım.

## Requirements
- R-1: Ana sayfa açıldığında sistemin sağlık durumu gösterilir: sistem çalışıyor mu, veritabanına
  erişilebiliyor mu.
- R-2: Sağlık durumu sunucudan sorgulanır. Sorgu sunum → API → iş → veri katmanlarının hepsinden geçer
  ve veritabanına gerçekten dokunur; sabit bir "çalışıyor" yanıtı değildir.
- R-3: Veritabanına erişilemediğinde sağlık sorgusu durumu "sorunlu" olarak bildirir; iç hata ayrıntısı
  (stack trace, SQL hatası, dosya yolu) yanıtta yer almaz. "Erişilemiyor": veritabanına yapılan basit
  bir okuma sorgusu hata verir.
- R-4: Sağlık sorgusu oturum gerektirmez (`docs/security.md`, varsayılan reddetmenin tek istisnası).
- R-5: Geliştirici projenin tamamını tek komutla doğrular (`./scripts/check`): tip denetimi, lint
  (katman kuralları dahil), biçim, testler ve üretim derlemesi. Hızlı profil (`--fast`) derleme
  dışındakileri çalıştırır.
- R-6: CI, her push ve pull request'te aynı full profili çalıştırır.
- R-7: Geliştirici README'deki adımlarla uygulamayı yerelde başlatıp ana sayfayı tarayıcıda açabilir.
- R-8: Stack ve n-katmanlı mimari kararları ADR olarak kayıtlıdır (bootstrap 2026-11-07'de bu spec'e
  bırakıldı).

## User experience
- **Flow:** kullanıcı uygulamanın ana sayfasını (kök yol `/`) açar → sayfa sağlık durumunu sorgular →
  sonucu gösterir. Sayfa başlığı: "İzin Yöneticisi".
- **States:**
  - *Yükleniyor:* "Sistem durumu kontrol ediliyor…"
  - *Başarılı (sağlıklı):* "Sistem çalışıyor" ve "Veritabanı: erişilebilir"
  - *Sorunlu:* sunucu yanıt verdi ama veritabanına erişilemiyor → "Sistem sorunlu" ve
    "Veritabanı: erişilemiyor"
  - *Hata:* sunucuya ulaşılamadı veya beklenmeyen bir yanıt geldi → "Sunucuya ulaşılamadı"; ham hata
    ayrıntısı gösterilmez
  - *Boş:* yok — sayfada liste veya veri yok
  - *Yetkisiz:* yok — sayfa ve sağlık sorgusu oturum gerektirmez
- **Design reference:** none — the flow above is the design.
- **Accessibility:** durum metni, değişince ekran okuyucunun duyuracağı bir canlı durum bölgesinde
  (status region) yer alır; durum yalnızca renkle değil her zaman metinle de belirtilir; sayfada
  etkileşimli öğe yoktur (klavye yolu gerekmez).

## Constraints & out of scope
- Stack, katmanlar ve konvansiyonlar `docs/architecture.md`, `docs/conventions.md`, `docs/testing.md` ve
  `docs/security.md`'de karara bağlıdır; bu spec onları uygular, değiştirmez.
- İsteğin kendisi sağlık sorgusunu `GET /api/health` olarak adlandırıyor; plan bunu izler.
- Hassas alan: yok — yetkilendirmeye dokunmaz (`docs/domain.md`).
- Residue testi (`Residue: clean (fast + full)`) ve test sayısı kontrolü BUILD'in Done'ının parçasıdır,
  kabul kriteri değildir (`docs/testing.md`, Resource hygiene 2).
- Zaman aşımı: v1'de sağlık sorgusu için zaman aşımı gereksinimi yok — SQLite yerel ve senkron, takılma
  senaryosu yok.
- Ortam: Node 24 LTS hattı. Bootstrap kararıyla Node, BUILD'den önce 24.11+'ya yükseltilir; PLAN kapısı
  doctor'ın profil kararını taşır (R-13).
- **Out of scope:** giriş/oturum ve tüm izin özellikleri · izin verisi şeması ve seed verisi · sağlık
  sayfasında "Tekrar dene" düğmesi veya otomatik yenileme (kullanıcı sayfayı yeniler) · sağlık yanıtında
  sürüm, çalışma süresi, sunucu adı gibi ek bilgiler · üretim derlemesinin bir sunucudan servis edilmesi
  ve dağıtım · Docker · e2e testleri.
- Split: 10 kriter tek bir uçtan uca dilimi tarif ediyor (walking skeleton tanımı gereği bölünmez) —
  bölünme önerilmedi.

## Acceptance criteria
- [x] AC-1 — Ana sayfa açıldığında, sağlık sorgusu yanıtlanana kadar "Sistem durumu kontrol ediliyor…" gösterilir.
- [x] AC-2 — Sistem ve veritabanı çalışıyorsa ana sayfa "Sistem çalışıyor" ve "Veritabanı: erişilebilir" gösterir.
- [x] AC-3 — Sunucu yanıt veriyor ama veritabanına erişilemiyorsa ana sayfa "Sistem sorunlu" ve "Veritabanı: erişilemiyor" gösterir.
- [x] AC-4 — Sunucuya ulaşılamıyorsa veya beklenmeyen bir yanıt gelirse (200 ve 503 dışındaki her HTTP durumu, JSON olmayan gövde veya ağ hatası) ana sayfa "Sunucuya ulaşılamadı" gösterir ve ham hata ayrıntısı göstermez.
- [x] AC-5 — Veritabanı erişilebilirken sağlık sorgusu, oturum olmadan, HTTP 200 ve sağlıklı sonucunu döner; sonuç gerçek bir veritabanı sorgusuyla belirlenir.
- [x] AC-6 — Veritabanı erişilemezken sağlık sorgusu HTTP 503 ve sorunlu sonucunu döner; yanıtta stack trace, SQL hatası veya dosya yolu bulunmaz.
- [x] AC-7 — `./scripts/check` tip denetimi, lint, biçim, test ve derleme adımlarını çalıştırıp `CHECK GREEN (full, 5 steps, …)` verir; `./scripts/check --fast` derleme dışındaki dört adımı çalıştırıp yeşil biter.
- [x] AC-8 — `docs/architecture.md`'deki beş yasak bağımlılığın her birinin ihlali lint adımını kırmızıya düşürür.
- [x] AC-9 — CI, bir push'ta Node 24 ile bağımlılıkları kurup `./scripts/check` full profilini çalıştırır ve yeşil biter.
- [x] AC-10 — Temiz bir klonda (repo dışında geçici bir dizin; `npm ci` dahil README'deki tüm adımlar; klon sonra silinir — `docs/testing.md`, Evidence policy 4) uygulama yerelde başlatılır ve ana sayfa tarayıcıda açılır.

## Definition of Done
- [x] Every acceptance criterion mapped to proof (test or reproducible observation)
- [x] `scripts/check` green
- [x] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `specs/backlog.md`
- [x] Docs / ADRs updated if behavior or architecture changed — burada: stack ADR'ı ve n-katmanlı mimari ADR'ı (`docs/decisions/`); `docs/conventions.md` "Enforced by tooling" artık "planlandı" değil
- [x] Spec moved to `specs/done/` (it becomes immutable there)

## Scorecard (fill at ship — honest numbers make the process improvable)
| Metric | Value |
|---|---|
| Spec revisions | 0 (self-critique onaydan önce katıldı) |
| Fix rounds | 1 |
| Review findings: real / noise / deferred | 3 / 0 / 0 (review round 1) · VERIFY: 1 / 2 / 0 |
| Regressions introduced | 0 |
| Bugs escaped to production | 0 (henüz dağıtım yok) |
