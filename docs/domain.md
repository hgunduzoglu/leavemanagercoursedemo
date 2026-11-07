# Domain

> Bootstrap 2026-11-07'de karara bağlandı. İş, insanlar ve agent'lar arasındaki ortak dil.
> Bir terim burada yoksa, agent'ın kendi anlamını uyduracağını varsayın.

## Ubiquitous language

| Term | Meaning | Notes / not to be confused with |
|---|---|---|
| Çalışan | Sisteme giriş yapıp izin talep eden kişi. Her çalışanın tam olarak bir yöneticisi vardır (en üstteki hariç). | Kod: `Employee` |
| Yönetici | Ekibindeki (doğrudan bağlı) çalışanların taleplerini onaylayan/reddeden çalışan. Yönetici de bir çalışandır; kendi adına izin talep eder. | Kod: `Manager` — bir rol, ayrı bir kişi türü değil. Admin değildir. |
| İzin talebi | Bir çalışanın belirli bir tarih aralığı için yaptığı yıllık izin isteği. | Kod: `LeaveRequest`. v1'de tek izin türü vardır: yıllık izin. |
| Talep durumu | `Beklemede` → `Onaylandı` / `Reddedildi` / `İptal edildi`. | Kod: `Pending` / `Approved` / `Rejected` / `Cancelled` |
| Yıllık hak | Çalışanın bir takvim yılı için hak ettiği izin günü sayısı. Seed verisiyle gelir; devretme yoktur. | Kod: `annualAllowance`. Kullanılabilir bakiye ile karıştırmayın. |
| Kullanılabilir bakiye | Yıllık hak − onaylanan günler − beklemedeki günler (aynı takvim yılı). | Kod: `availableBalance`. Beklemedeki talepler de düşülür (BR-5). |
| İş günü | Pazartesi–Cuma. Hafta sonu sayılmaz; resmi tatiller v1'de yoktur. | Kod: `WorkingDay` |
| Talep süresi | Tarih aralığındaki (iki uç dahil) iş günü sayısı. Yalnızca tam gün; yarım gün yoktur. | Kod: `durationDays`. Takvim günü sayısı değildir. |

## Business rules
- **BR-1:** Başlangıç tarihi ≤ bitiş tarihi; iki tarih de aralığa dahildir.
- **BR-2:** Talep süresi, aralıktaki iş günü sayısıdır. Süresi 0 olan talep (tamamı hafta sonuna düşen) oluşturulamaz.
- **BR-3:** Geçmiş tarihli talep oluşturulamaz (başlangıç ≥ bugün, Europe/Istanbul).
- **BR-4:** Bir talep tek bir takvim yılı içinde kalır; yıl sınırını geçemez.
- **BR-5:** Talep süresi kullanılabilir bakiyeyi aşamaz (beklemedeki talepler de bakiyeden düşülür; aynı günler iki kez talep edilemez).
- **BR-6:** Yeni talep, çalışanın `Beklemede` veya `Onaylandı` durumundaki bir talebiyle çakışamaz.
- **BR-7:** Talebi yalnızca çalışanın kendi (doğrudan) yöneticisi onaylayabilir veya reddedebilir; hiç kimse kendi talebini onaylayamaz/reddedemez.
- **BR-8:** Reddetmek için gerekçe zorunludur.
- **BR-9:** Yalnızca `Beklemede` durumundaki talep onaylanabilir, reddedilebilir veya iptal edilebilir; iptali yalnızca talebi oluşturan çalışan yapabilir.
- **BR-10:** `Onaylandı`, `Reddedildi` ve `İptal edildi` son durumlardır; bu durumdaki talep bir daha değişmez.

## Key domain invariants
- Kullanılabilir bakiye asla negatif olmaz.
- Bir çalışanın aktif (`Beklemede` veya `Onaylandı`) talepleri birbiriyle çakışmaz.
- Son durumdaki bir talep değişmez.

## Sensitive areas
<!-- Where a mistake costs money, access or legal standing (e.g. payments, identity, personal
     data). A spec that touches one says so in Constraints (`Sensitive area: <name>`); there the
     clarify gate is asked in lite too, every fix round but a documents-only one is
     re-reviewed, and every criterion is proven red by one deliberate break
     (workflows/README.md, Modes). "None" is a valid answer. -->
- **Yetkilendirme** — kimin hangi talebi görebileceği, onaylayabileceği, reddedebileceği ve iptal
  edebileceği (BR-7, BR-9; kurallar `docs/security.md` "AuthN / AuthZ"). Spec'te:
  `Sensitive area: Yetkilendirme`.
- Bilinçli olarak hassas **sayılmayanlar** (bootstrap 2026-11-07):
  - İzin bakiyesi (BR-5) — sıradan testler ve review ile korunur.
  - Kişisel veri — demo verisi tamamen kurgusaldır. Gerçek kişi verisi girerse bu karar yeniden açılır.
