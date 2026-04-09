# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Ticket Sistemi

Web tabanlı destek/talep yönetim (ticket) uygulaması. **Next.js 14 (App Router) + Prisma + SQLite + NextAuth v5** stack'i kullanılıyor.

## Komutlar

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Prisma şemasını DB'ye yansıt (migration yerine)
npm run db:seed      # Seed verisi yükle (prisma/seed.ts)
npm run db:studio    # Prisma Studio (DB GUI)
```

`.env` dosyasında `DATABASE_URL` ve `AUTH_SECRET` gereklidir. `AUTH_SECRET` için: `openssl rand -base64 32`

Google OAuth için ek olarak `.env`'e eklenmesi gerekenler:
```
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```
Bu değerler Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID'den alınır.
Redirect URI olarak şunlar eklenmeli:
- Geliştirme: `http://localhost:3000/api/auth/callback/google`
- Prodüksiyon: `https://yourdomain.com/api/auth/callback/google`

## Mimari

### Katmanlar

```
src/
├── app/
│   ├── (auth)/          # Login, Register — sidebar/header yok
│   ├── (dashboard)/     # Tüm korumalı sayfalar
│   └── api/             # Route handler'lar (Next.js API)
├── components/
│   ├── ui/              # Atomic: Button, Input, Badge, Modal, RichTextEditor...
│   ├── tickets/         # Domain: TicketCard, TicketForm, CommentSection...
│   └── layout/          # Header, Sidebar, NotificationBell, ThemeToggle
├── hooks/               # React Query mutation/query hook'ları (useTickets, useTicket...)
├── lib/
│   ├── api/             # Client-side fetch fonksiyonları (tickets.ts, users.ts...)
│   ├── validations/     # Zod şemaları (ticket.ts, comment.ts, user.ts)
│   ├── auth.ts          # NextAuth config (JWT strategy, CredentialsProvider + GoogleProvider)
│   ├── db.ts            # Singleton Prisma client
│   └── notifications.ts # Bildirim oluşturma yardımcıları
└── types/index.ts       # Tüm domain tipleri (Role, Status, Priority, Ticket, User...)
```

### Veri Akışı

**UI → hook → lib/api → API route → Prisma → SQLite**

- Bileşenler hook'ları çağırır (`useTickets`, `useCreateTicket` vb.)
- Hook'lar `lib/api/` fonksiyonlarını React Query üzerinden çağırır
- API route'lar `auth()` ile session doğrular, Zod ile input validate eder, Prisma ile DB'ye yazar
- Bildirimler API route içinde `void notifyX()` (fire-and-forget) ile tetiklenir — `await` ekleme

### Yetkilendirme

Roller: `Admin` | `SupportTeam` | `EndUser`

- JWT callback'te role bilgisi session'a eklenir (`src/lib/auth.ts`)
- `EndUser` yalnızca kendi ticketlarını görür; Admin/SupportTeam hepsini görür (`src/app/api/tickets/route.ts`)
- Her API handler `const session = await auth()` ile doğrulama yapar

### Ticket Geçmişi (Audit Log)

`TicketHistory` modeli her durum/öncelik/atama değişikliğini kaydeder. API route'larda `prisma.ticketHistory.create()` ile yazılır. `TicketHistoryLog` bileşeni timeline olarak gösterir.

### Zengin Metin

`src/components/ui/RichTextEditor.tsx` — TipTap editörü. Ticket açıklama ve yorumlarda kullanılıyor. İçerik HTML string olarak saklanıyor; `dangerouslySetInnerHTML` ile render ediliyor (içerik yalnızca kendi kullanıcılarımızdan geliyor).

### Tasarım Sistemi (Güncel)

- **Primary:** `#6366F1` (indigo-500) → hover `#4F46E5`
- **Sayfa arka planı:** `#F0F2FF` (lavender, light) / `hsl(var(--background))` (dark)
- **Aktif nav:** `bg-[#EEF2FF] text-[#6366F1]`
- **Kart:** `rounded-2xl border-gray-100 shadow-card` (custom shadow tailwind.config.ts'de)
- **Ticket listesi:** Tablo layout (`grid-cols-[2fr_1.5fr_1fr_1fr_1fr_52px]`) — `TicketList.tsx` header ile `TicketCard.tsx` grid birebir senkron olmalı
- **Badge'ler:** Dot indicator + metin (`StatusBadge`), dot + metin (`PriorityBadge` — pill değil)
- **ThemeToggle:** `src/components/layout/ThemeToggle.tsx` — HİÇ DEĞİŞTİRİLMEYECEK

## Tasarım İlkeleri

- Tailwind CSS kullan, custom CSS dosyası oluşturma
- Minimal, temiz ve kullanıcı dostu arayüz — gereksiz görsel karmaşadan kaçın
- Tutarlı spacing, renk paleti ve tipografi kullan
- **Mobile-first zorunlu:** Tüm yeni bileşenler ve sayfa düzenlemeleri önce mobil ekran için tasarlanır, sonra büyük ekrana genişletilir. Tailwind'de `sm:` `md:` `lg:` prefix'leri bu sırayla kullanılır, tersine değil.
- **Native uygulama hissi:** Dokunma hedefleri min 44px, bottom navigation mobilde, kaydırma davranışları native, geçiş animasyonları akıcı — kullanıcı uygulamayı web sitesi değil mobil uygulama gibi hissetmeli.
- Erişilebilirlik (a11y): semantic HTML, ARIA label'ları, klavye navigasyonu
- Dark mode desteği için Tailwind'in `dark:` prefix'ini kullan

### Mobil-First Geliştirme Kuralları (ÖNCELİKLİ)
- Önce mobil layout yaz, sonra `md:` / `lg:` ile masaüstüne genişlet
- Sidebar mobilde gizli olmalı, bottom navigation veya drawer ile erişilmeli
- Modal'lar mobilde full-screen veya bottom sheet olmalı
- Buton ve dokunma alanları minimum `h-11` (44px)
- Font boyutları mobilde okunabilir: minimum `text-sm`
- Padding/margin mobilde daha sıkı: `p-4` → masaüstünde `p-6`
- Dashboard grafik ve kartları mobilde tek sütun, masaüstünde çok sütun

### ⚠️ Mobil Geliştirme Temel Kural
**Yalnızca front-end değiştirilir — backend, API route'ları ve veritabanı katmanına dokunulmaz.**
Masaüstünde aktif olarak çalışan her özellik (ticket oluşturma, yorum gönderme, dosya ekleme, bildirimler, durum değiştirme, admin paneli vb.) mobilde de **eksiksiz ve aynı işlevsellikle** çalışmalıdır. Mobil uyumluluk hiçbir mevcut özelliği kırmamalı, sadece görünüm ve etkileşimi iyileştirmeli.

### Dashboard Özet Sekmesi Notu
`src/components/dashboard/SummaryTab.tsx` içindeki metric kartları, alan grafiği ve sütun grafiği içerikleri (veriler, metrikler, grafik türleri) **geçicidir ve ileride değişecektir.** Bu component'e bağımlı yeni özellikler ekleme, içeriği sabit kabul etme.

## Mimari Kurallar

- Bileşenleri küçük ve tek sorumlu tut (Single Responsibility)
- İş mantığını UI bileşenlerinden ayır
- API çağrılarını merkezi bir katmanda topla, bileşen içinde dağıtma
- Hata yönetimi ve loading state'leri her async işlemde zorunlu
- Çevre değişkenlerini `.env` dosyasında tut, asla commit etme

## Ticket Sistemi Domain Bilgisi

Temel varlıklar: Ticket, User, Comment, Category, Priority, Status
Ticket durumları: Açık → Devam Ediyor → Beklemede → Çözüldü → Kapatıldı
Öncelik seviyeleri: Düşük, Normal, Yüksek, Acil
Her ticket mutlaka bir oluşturan kullanıcıya ve bir kategoriye bağlı olmalı
Yetkilendirme: Admin, Destek Ekibi, Son Kullanıcı rolleri

## Kod Standartları

- Değişken ve fonksiyon adları İngilizce, açıklayıcı ve anlamlı
- Dosya adlandırma: kebab-case
- Bileşen adlandırma: PascalCase
- Type safety: mümkün olan her yerde tipler kullan, `any` yasak
- Yorum satırları sadece "neden" açıklamak için, "ne" yapıldığını kod kendisi anlatmalı
- Console.log'ları commit etme

## İş Akışı

1. Değişiklik yapmadan önce mevcut kodu ve ilgili dosyaları oku
2. Karmaşık değişikliklerde önce plan sun, onay al, sonra uygula
3. Her yeni özellik için ilgili testleri yaz veya güncelle
4. Değişiklik sonrası lint ve test komutlarını çalıştır
5. Commit mesajları Conventional Commits formatında: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

## Dikkat Edilecekler

- `.env` dosyaları asla versiyon kontrolüne eklenmemeli
- Kullanıcı şifrelerini düz metin olarak saklama
- SQL injection ve XSS gibi güvenlik açıklarına karşı tüm girdileri doğrula
- Hassas bilgileri (API key, secret) loglama
- Büyük veri listelerinde mutlaka sayfalama (pagination) uygula
- Compaction sırasında ticket domain modelini ve dosya değişiklik listesini koru

## Planlanan UX İyileştirmeleri (Sırayla Uygulanacak)

### Tamamlananlar ✅
- Aşama 1: Dil Türkçeleştirme (tüm UI metinleri, tarih/saat Türkçe locale)
- Aşama 1b: Giriş Ekranı Dark/Light Toggle
- Aşama 2: TipTap zengin metin editörü (bold, italic, liste, kod bloğu)
- Aşama 3: Ticket Geçmişi / Audit Log (TicketHistory modeli + timeline bileşeni)
- Aşama 5: Referans görsellere dayalı tam tasarım dönüşümü (mor/indigo primary, lavender bg, tablo layout, yeni login, sidebar, header)
- Aşama 5b: UX iyileştirmeleri — filtre dropdown'ları yan yana, Yeni Talep modal'a taşındı, SweetAlert2 kapsamı genişledi
- Aşama 3: Dosya Ekleri — ticket ve yorumlara dosya/resim/PDF ekleme (max 5MB, `public/uploads/`, `Attachment` Prisma modeli)
- **Aşama 4: Ticket Şablonları** — yaygın sorunlar için hazır taslaklar; admin panelinden ekleme/düzenleme/silme; ticket oluştururken şablon seçimi (`TicketTemplate` Prisma modeli, `src/app/(dashboard)/admin/templates/`, `src/hooks/useTemplates.ts`)

### SweetAlert2 Kullanım Alanları
- TicketDetail: silme, üstlenme, bırakma, **durum değiştirme**, **öncelik değiştirme**
- Admin/categories: silme, **oluşturma başarı toast**, **güncelleme başarı toast**
- Admin/users: rol değiştirme
- RegisterForm: kayıt başarısı (timer+progress bar), API hatası, bağlantı hatası
- LoginForm: hatalı giriş, bağlantı hatası
- Header: çıkış yapma onayı (`question` icon, İptal/Evet butonu)

### TicketForm Dual-Mode
`src/components/tickets/TicketForm.tsx` iki modda çalışır:
- **Modal modu:** `onSuccess?: (id: string) => void` ve `onCancel?: () => void` prop'ları ile — tickets/page.tsx içindeki `<Modal>` içinde kullanılır
- **Sayfa modu:** Props yok → submit sonrası `router.push`, iptal → `router.back()` (tickets/new/page.tsx)

### Tamamlananlar ✅ (devam)
- Aşama 6: SSE ile gerçek zamanlı bildirimler (`/api/notifications/stream`, `src/lib/sse.ts`)
- Dashboard Özet Sekmesi — metric kartlar, alan grafiği, sütun grafiği, animasyonlu tab geçişi
- Google OAuth altyapısı — prisma schema (Account, Session, VerificationToken modelleri eklendi, password nullable yapıldı), auth.ts GoogleProvider+PrismaAdapter hazır; GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET .env'e girilince aktif olacak
- **Global Navigation Spinner** — her link/buton tıklamasında sayfa geçişi boyunca `OrbitalLoader` overlay gösterilir
  - `src/components/ui/Spinner.tsx` → `sshahaider/spinner-1` tasarımıyla yeniden yazıldı (dönen çubuk animasyonu, `size: number`, `invert` prop)
  - `src/components/ui/orbital-loader.tsx` → `molecule-lab-rushil/orbital-loader` eklendi; `color` prop ile proje rengi `#6366F1` varsayılan
  - `src/components/layout/NavigationProgress.tsx` → yeni bileşen; document click listener ile link navigasyonlarını yakalar, `usePathname`/`useSearchParams` değişince kapanır; `Suspense` içinde `providers.tsx`'e eklendi
  - `npm` bağımlılığı eklendi: `motion` (OrbitalLoader için)
  - `src/components/ui/spinner-1.tsx` → `Spinner`'ı re-export eden alias dosyası (shadcn import path uyumu için)
- **cc: Mobile-first yeniden düzenleme** — BottomNav ghost slot'lar kaldırıldı, TicketDetail mobilde sidebar önce gelir (order-1/order-2), TicketFilters arama h-11, CommentSection flex-wrap, TicketForm butonlar full-width mobilde, admin sayfaları responsive
- **shadcn bileşenleri eklendi:**
  - `src/components/ui/interfaces-switch.tsx` — Radix UI Switch (@radix-ui/react-switch)
  - `src/components/ui/interfaces-select.tsx` — Radix UI Select (@radix-ui/react-select)
- **TicketFilters yeniden yazıldı** — `interfaces-select` kullanıyor, aktif filtre indigo vurgulu, sıfırla butonu badge'li, boş string yerine `"all"` sentinel değeri kullanılıyor (Radix Select boş string kabul etmez)
- **tailwind.config.ts genişletildi** — `popover`, `accent`, `muted`, `destructive` color token'ları eklendi
- **globals.css genişletildi** — `--popover`, `--accent`, `--muted`, `--destructive` CSS değişkenleri light/dark için tanımlandı
- **interfaces-select.tsx özelleştirildi** — `bg-background`/`dark:bg-input` token'ları yerine `bg-white dark:bg-gray-800` kullanılıyor, item hover indigo renk
- **Auth sayfaları yeniden tasarlandı (Login + Register tam dark/light uyumu):**
  - `src/app/(auth)/layout.tsx` → ThemeToggle kaldırıldı; her sayfa kendi toggle'ını yönetiyor
  - `src/components/auth/LoginThemeToggle.tsx` → yeni bileşen; light modda `text-gray-500`, dark modda `text-white/50`
  - `src/app/(auth)/login/page.tsx` → `bg-[#F0F2FF] dark:bg-[#0f1117]`; sol panel metinleri, özellik ikonları, glow efektleri dark/light uyumlu Tailwind class'larıyla
  - `src/components/auth/LoginForm.tsx` → tüm inline `style={{ color: "rgba(255,255,255,...)" }}` kaldırıldı; kart `bg-white dark:bg-white/[0.04]`, inputlar `dark:bg-white/[0.06] dark:border-white/10 dark:text-white`, SweetAlert2 ile hata bildirimleri
  - `src/app/(auth)/register/page.tsx` → login ile aynı iki panel layout (grid deseni, glow, ayırıcı çizgi, sol panel özellik listesi)
  - `src/components/auth/RegisterForm.tsx` → login form stiliyle uyumlu; SweetAlert2 ile başarı/hata bildirimleri, `success` state ve inline hata div'i kaldırıldı
- **Bildirim mesajları Türkçeleştirildi** (`src/lib/notifications.ts`):
  - Tüm İngilizce mesajlar Türkçeye çevrildi
  - `STATUS_TR` map eklendi: `Open→Açık`, `InProgress→Devam Ediyor`, `Waiting→Beklemede`, `Resolved→Çözüldü`, `Closed→Kapatıldı`
  - Durum değişikliği: `"'...' durumu Açık → Devam Ediyor olarak güncellendi (Ad Soyad)"`
  - Yorum: `"Ad Soyad, '...' talebine yorum yaptı"`
  - Atama: `"'...' talebi size atandı"` / `"'...' talebi Ad Soyad kişisine atandı"`
  - Bırakma: `"'...' talebi Ad Soyad tarafından bırakıldı"`

### ⚠️ shadcn init Uyarısı
`npx shadcn@latest init` komutu çalıştırıldığında şu dosyaları **otomatik bozar:**
- `src/app/globals.css` → `@import "tw-animate-css"` ve oklch token'ları ekler
- `src/app/layout.tsx` → Geist fontu ekler
- `src/components/ui/Button.tsx` → `@base-ui/react/button` ile değiştirir
- `tailwind.config.ts` → `darkMode: ["class", "class"]` tekrarı ekler

Bu olursa ilgili dosyaları orijinaline döndür, `.next` cache'ini temizle (`rm -rf .next`), sunucuyu yeniden başlat.

### Tamamlananlar ✅ (devam)

- **GitHub'a yüklendi** — `https://github.com/ibkkocabiyik/ticket-management-system` (master branch)
- **Vercel'e deploy edildi** — `https://ticket-teal.vercel.app`
  - Build scripti `prisma generate && next build` olarak güncellendi
  - TypeScript build hataları düzeltildi: `categoryId?: string`, `template.category?.name`, `user.password` null guard
  - `NEXTAUTH_URL` production URL'ye güncellendi
- **Veritabanı PostgreSQL'e taşındı** — Neon.tech (eu-central-1)
  - `prisma/schema.prisma` → `provider: "postgresql"`, `directUrl` eklendi
  - `DATABASE_URL` (pooled) ve `DIRECT_URL` (direct) Vercel env'e eklendi
  - `AUTH_SECRET` Vercel env'e eklendi
  - `prisma db push` ile şema Neon'a yansıtıldı, seed verisi yüklendi
- **Bildirim sistemi SSE→Polling'e taşındı** — Vercel serverless ortamında SSE (Server-Sent Events) in-memory state paylaşamadığı için çalışmıyor; `useNotifications` hook'u her 10 saniyede polling yapacak şekilde yeniden yazıldı
- **Ticket toplu işlemler (bulk actions)** — Admin'e özel çoklu seçim modu; durum değiştir, öncelik değiştir, sil işlemleri
  - `src/app/api/tickets/bulk/route.ts` → POST endpoint; delete/status/priority bulk işlemleri, `TicketHistory` Türkçe alan adları ile yazılıyor
  - `src/components/tickets/TicketList.tsx` → "Çoklu Seçim" butonu, aksiyon çubuğu (Durum Değiştir / Öncelik Değiştir / Sil), "Tümünü seç" checkbox; seçim modunda grid `grid-cols-[32px_2fr_1.5fr_1fr_1fr_1fr_52px]`
  - `src/components/tickets/TicketCard.tsx` → `selectable`, `selected`, `onSelect` prop'ları eklendi
  - `src/hooks/useTickets.ts` → `useBulkTicketAction` mutation hook eklendi
  - `src/lib/api/tickets.ts` → `BulkAction` tipi ve `bulkTicketAction` fonksiyonu eklendi
- **Tüm dropdown'lar Radix UI'ya taşındı** — TicketDetail (durum/öncelik), TicketForm (kategori/öncelik), admin/templates (kategori) artık `interfaces-select` kullanıyor; `Controller` ile react-hook-form entegrasyonu
- **Ticket geçmişi tamamen Türkçeleştirildi** — `TicketHistoryLog.tsx`'e `fieldLabels` ve `valueLabels` eklendi; tüm Status/Priority İngilizce değerleri Türkçe görüntüleniyor
- **Dashboard'a mobil-only Şablonlar kartı eklendi** — `src/app/(dashboard)/dashboard/page.tsx`; `className="md:hidden"` ile yalnızca mobilde admin'e görünür
- **Admin kullanıcı yönetimi modal ile yeniden tasarlandı** — `src/app/(dashboard)/admin/users/page.tsx`
  - Satır içi düzenleme kaldırıldı; satıra tıklayınca `EditUserModal` açılıyor
  - `EditUserModal`: isim Input, rol Radix Select (kendisi için disabled), read-only email, Sil butonu (kendi hesabı değilse), İptal + Kaydet
  - `CreateUserModal`: isim, e-posta, şifre, rol alanları; admin yeni kullanıcı ekleyebiliyor
  - Çoklu seçim + toplu silme desteği
  - `src/app/api/users/[id]/route.ts` → PATCH artık hem `name` hem `role` kabul ediyor; DELETE handler eklendi
  - `src/app/api/users/bulk/route.ts` → POST, Admin-only toplu silme (kendi hesabı korunuyor)
  - `src/app/api/users/route.ts` → POST artık Admin ise `role` parametresi kabul ediyor
  - `src/lib/api/users.ts` → `createUser`, `updateUserName`, `deleteUser`, `bulkDeleteUsers` eklendi

- **Bildirim paneli — "Tüm bildirimleri gör" slide-out drawer** — bildirim dropdown'ının altına buton eklendi; tıklandığında sağdan kayan panel açılıyor
  - `src/components/layout/NotificationBell.tsx` → `PanelNotificationItem` inner component, `formatRelativeTime` helper, `isPanelOpen` state, backdrop + drawer markup, ESC/scroll-lock effect, dropdown footer butonu
  - `src/hooks/useNotifications.ts` → `useAllNotifications(enabled)` hook eklendi (polling yok, panel açıkken aktif); her iki mutation'a `["notifications", "all"]` invalidation eklendi
  - `src/lib/api/notifications.ts` → `getNotificationsWithLimit(limit)` fonksiyonu eklendi
  - `src/app/api/notifications/route.ts` → `GET(request: Request)` ile `?limit=N` query param desteği (1–50 arası kısıtlı)
  - `tailwind.config.ts` → `slide-in-right` keyframe + animation token eklendi
  - Panel özellikleri: son 50 bildirim, okunmamışlar indigo sol border, göreceli zaman ("5 dk önce"), "Tümünü okundu işaretle", mobilde tam genişlik / tablet+ 384px

### ⚠️ Vercel / Production Notları
- SSE (`/api/notifications/stream`) Vercel'de çalışmaz — serverless'ta kalıcı bağlantı ve in-memory state paylaşımı desteklenmez
- Bildirimler şu an polling ile çalışıyor (10s interval); ses tetikleme `unreadCount` artışına bağlı
- Dosya yükleme (`public/uploads/`) Vercel'de kalıcı değil — ileride S3/Cloudflare R2'ye taşınmalı

### Sıradaki

**Bildirim Sesi (bekleyen)**
- `useNotifications` hook'unda polling ile `unreadCount` artışı tespit ediliyor ancak ses çalmıyor
- Muhtemel sebep: tarayıcı AudioContext'i kullanıcı etkileşimi olmadan başlatmayı engelliyor (autoplay policy)
- Çözüm önerisi: kullanıcının ilk etkileşiminde (tıklama) AudioContext'i başlatıp `suspended` → `running` state'e almak (`ctx.resume()`)

**Aşama 7: E-posta Bildirimleri**
- Nodemailer entegrasyonu
- Ticket oluşturulunca, yanıtlanınca otomatik mail