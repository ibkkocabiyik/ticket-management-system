import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Veritabanı temizleniyor...");

  await prisma.attachment.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Yeni veriler oluşturuluyor...");

  const adminPw = await bcryptjs.hash("admin123", 10);
  const supportPw = await bcryptjs.hash("support123", 10);
  const userPw = await bcryptjs.hash("user123", 10);

  // ─── Kullanıcılar ───────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: "admin@hostpanel.com.tr", name: "Kerem Arslan", password: adminPw, role: "Admin" },
  });
  const support1 = await prisma.user.create({
    data: { email: "teknik1@hostpanel.com.tr", name: "Elif Yıldız", password: supportPw, role: "SupportTeam" },
  });
  const support2 = await prisma.user.create({
    data: { email: "teknik2@hostpanel.com.tr", name: "Burak Doğan", password: supportPw, role: "SupportTeam" },
  });
  const support3 = await prisma.user.create({
    data: { email: "teknik3@hostpanel.com.tr", name: "Selin Çelik", password: supportPw, role: "SupportTeam" },
  });
  const support4 = await prisma.user.create({
    data: { email: "teknik4@hostpanel.com.tr", name: "Murat Kaya", password: supportPw, role: "SupportTeam" },
  });
  const user1 = await prisma.user.create({
    data: { email: "info@digitalmedya.com.tr", name: "Ahmet Demir", password: userPw, role: "EndUser" },
  });
  const user2 = await prisma.user.create({
    data: { email: "it@novanet.com.tr", name: "Zeynep Şahin", password: userPw, role: "EndUser" },
  });
  const user3 = await prisma.user.create({
    data: { email: "destek@eticaretplus.com", name: "Emre Aydın", password: userPw, role: "EndUser" },
  });

  console.log("Kullanıcılar oluşturuldu");

  // ─── Kategoriler ────────────────────────────────────────────────────────────
  const catDomain = await prisma.category.create({
    data: { name: "Domain & DNS", description: "Alan adı transferi, DNS kayıtları, yönlendirme ve WHOIS işlemleri" },
  });
  const catHosting = await prisma.category.create({
    data: { name: "Hosting & Sunucu", description: "Paylaşımlı hosting, VPS, dedicated sunucu ve cPanel sorunları" },
  });
  const catSSL = await prisma.category.create({
    data: { name: "SSL & Güvenlik", description: "SSL sertifikası kurulumu, yenileme ve güvenlik sorunları" },
  });
  const catFatura = await prisma.category.create({
    data: { name: "Fatura & Ödeme", description: "Fatura itirazı, ödeme sorunları, plan yükseltme ve iade talepleri" },
  });
  const catEmail = await prisma.category.create({
    data: { name: "E-posta", description: "Kurumsal e-posta hesapları, spam, SMTP/IMAP yapılandırması" },
  });
  const catPerformans = await prisma.category.create({
    data: { name: "Performans", description: "Yavaş yükleme, kaynak kullanımı, önbellek ve optimizasyon sorunları" },
  });

  console.log("Kategoriler oluşturuldu");

  function ago(minutes: number): Date {
    return new Date(Date.now() - minutes * 60 * 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 1 — SSL sertifikası yenilenmiyor (Acil / İşlemde)
  // ═══════════════════════════════════════════════════════════════════════════
  const t1 = await prisma.ticket.create({
    data: {
      title: "SSL sertifikası yenilenmedi, site güvensiz görünüyor",
      description: `<p>digitalmedya.com.tr alan adı için Let's Encrypt SSL sertifikamız dün gece sona erdi. Tarayıcılar <strong>"Bağlantınız güvenli değil"</strong> uyarısı veriyor ve ziyaretçiler sitemize giremiyor.</p>

<p>Otomatik yenileme aktifti ancak çalışmadı. cPanel'den kontrol ettim, sertifika durumu <em>"Süresi Doldu"</em> olarak görünüyor.</p>

<ul>
  <li>Alan adı: digitalmedya.com.tr</li>
  <li>Hosting paketi: Business Hosting X5</li>
  <li>Son sertifika tarihi: Dün 23:59</li>
</ul>

<p>Lütfen acil olarak müdahale edin, e-ticaret sitemiz çalışmıyor.</p>`,
      status: "InProgress",
      priority: "Urgent",
      creatorId: user1.id,
      assigneeId: support1.id,
      categoryId: catSSL.id,
      createdAt: ago(180),
      updatedAt: ago(30),
    },
  });

  const t1c1 = await prisma.comment.create({
    data: {
      content: `<p>Merhaba Ahmet Bey, talebinizi aldık. Sunucu tarafında SSL yenileme loglarını inceliyorum.</p><p>İlk tespitimize göre <code>certbot</code> cronjob'u bir önceki güncelleme sırasında devre dışı kalmış. Şu an manuel olarak yenileme başlatıyorum.</p>`,
      authorId: support1.id,
      ticketId: t1.id,
      createdAt: ago(150),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Tamam, bekliyorum. Site şu an tamamen erişilemez durumda, müşterilerimiz de bizi arıyor. Ne kadar sürer?</p>`,
      authorId: user1.id,
      ticketId: t1.id,
      createdAt: ago(140),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Sertifika yenilendi ve sunucuya uygulandı. <strong>digitalmedya.com.tr</strong> artık HTTPS üzerinden erişilebilir durumda.</p>
<p>Ek olarak cronjob ayarını kalıcı olarak düzelttim. Bundan böyle otomatik yenileme sorunsuz çalışacak. 90 gün önce size bildirim e-postası da göndereceğiz.</p>`,
      authorId: support1.id,
      ticketId: t1.id,
      createdAt: ago(30),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t1.id, userId: user1.id, action: "ticket_created", createdAt: ago(180) },
      { ticketId: t1.id, userId: support1.id, action: "priority_changed", field: "Öncelik", oldValue: "Yüksek", newValue: "Acil", createdAt: ago(170) },
      { ticketId: t1.id, userId: support1.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Elif Yıldız", createdAt: ago(170) },
      { ticketId: t1.id, userId: support1.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(165) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 2 — Domain transferi takılı kaldı (Yüksek / Beklemede)
  // ═══════════════════════════════════════════════════════════════════════════
  const t2 = await prisma.ticket.create({
    data: {
      title: "novanet.com.tr domain transferi 5 gündür tamamlanmıyor",
      description: `<p>novanet.com.tr alan adını başka bir kayıt kuruluşundan sizi transfer etmek istiyoruz. Transfer talebini 5 gün önce başlattık, EPP kodunu girdik ancak transfer hâlâ <em>"Beklemede"</em> durumunda.</p>

<p>Eski kayıt kuruluşundan çıkan bir engel yok, tarafımızdan onay verdik. Sorunun nerede olduğunu anlamak istiyoruz.</p>

<ul>
  <li>Alan adı: novanet.com.tr</li>
  <li>Mevcut kayıt kuruluşu: Eski Sağlayıcı A.Ş.</li>
  <li>Transfer başlangıç tarihi: 5 gün önce</li>
  <li>EPP kodu: Doğru girildi (3 kez kontrol ettik)</li>
</ul>`,
      status: "Waiting",
      priority: "High",
      creatorId: user2.id,
      assigneeId: support2.id,
      categoryId: catDomain.id,
      createdAt: ago(7200),
      updatedAt: ago(1440),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Zeynep Hanım, merhaba. Transfer talebini sistemimizde inceliyorum.</p><p>.com.tr uzantıları için NIC.tr üzerinden onay gerekiyor. WHOIS kayıtlarında e-posta adresiniz eski bir adres olarak görünüyor; onay maili oraya gitmiş olabilir. Lütfen kontrol eder misiniz?</p>`,
      authorId: support2.id,
      ticketId: t2.id,
      createdAt: ago(7000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Kontrol ettim, eski e-posta adresi artık aktif değil. WHOIS'teki e-postayı nasıl güncelleyebilirim?</p>`,
      authorId: user2.id,
      ticketId: t2.id,
      createdAt: ago(6800),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>NIC.tr'ye resmi talep formu gönderdik, WHOIS güncellemesi için 2-3 iş günü beklememiz gerekiyor. Bu süreçte transfer askıya alındı. Güncelleme tamamlandığında transfer otomatik devam edecek ve sizi bilgilendireceğiz.</p>`,
      authorId: support2.id,
      ticketId: t2.id,
      createdAt: ago(1440),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t2.id, userId: user2.id, action: "ticket_created", createdAt: ago(7200) },
      { ticketId: t2.id, userId: support2.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Burak Doğan", createdAt: ago(7100) },
      { ticketId: t2.id, userId: support2.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(7100) },
      { ticketId: t2.id, userId: support2.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Beklemede", createdAt: ago(1440) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 3 — VPS sunucu erişilemiyor (Acil / İşlemde)
  // ═══════════════════════════════════════════════════════════════════════════
  const t3 = await prisma.ticket.create({
    data: {
      title: "VPS sunucuya SSH ile bağlanamıyorum, panel de açılmıyor",
      description: `<p>Sabahtan beri VPS sunucumuza ne SSH ile ne de Plesk kontrol paneli üzerinden bağlanabiliyorum. Sunucu IP'si <strong>185.92.x.x</strong> olan makinemiz tamamen yanıt vermiyor.</p>

<p>Ping atıyorum, <code>Request timeout</code> alıyorum. Üzerinde 3 aktif web sitemiz ve bir mail sunucusu var.</p>

<ul>
  <li>Sunucu paketi: VPS Pro 4 vCPU / 8 GB RAM</li>
  <li>İşletim sistemi: Ubuntu 22.04 LTS</li>
  <li>Son yapılan işlem: Dün gece kernel güncellemesi</li>
</ul>

<p>Acil yardım bekliyorum, üretimdeki sistemlerimiz etkileniyor.</p>`,
      status: "InProgress",
      priority: "Urgent",
      creatorId: user3.id,
      assigneeId: support1.id,
      categoryId: catHosting.id,
      createdAt: ago(300),
      updatedAt: ago(20),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Emre Bey, merhaba. Sunucu durumunu hypervisor seviyesinden kontrol ediyorum.</p><p>İlk bakışta kernel güncellemesi sonrası önyükleme döngüsüne girmiş görünüyor. Rescue mode'a alıyorum, 5-10 dakika içinde geri döneceğim.</p>`,
      authorId: support1.id,
      ticketId: t3.id,
      createdAt: ago(280),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Tamam, bekliyorum. Verilerimiz kaybolur mu?</p>`,
      authorId: user3.id,
      ticketId: t3.id,
      createdAt: ago(270),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Verileriniz tamamen güvende, disk bütünlüğünü kontrol ettim. Sorun: yeni kernel sürümü <code>grub</code> yapılandırmasında uyumsuzluk yaratmış.</p>
<p>Eski kernel versiyonuyla boot ettim, sunucu şu an ayağa kalkıyor. SSH erişiminizi test edebilirsiniz.</p>`,
      authorId: support1.id,
      ticketId: t3.id,
      createdAt: ago(20),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t3.id, userId: user3.id, action: "ticket_created", createdAt: ago(300) },
      { ticketId: t3.id, userId: support1.id, action: "priority_changed", field: "Öncelik", oldValue: "Normal", newValue: "Acil", createdAt: ago(295) },
      { ticketId: t3.id, userId: support1.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Elif Yıldız", createdAt: ago(290) },
      { ticketId: t3.id, userId: support1.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(290) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 4 — DNS kayıtları yayılmıyor (Normal / İşlemde)
  // ═══════════════════════════════════════════════════════════════════════════
  const t4 = await prisma.ticket.create({
    data: {
      title: "DNS kayıtlarını güncelledim ama 48 saat oldu yayılmadı",
      description: `<p>novanet.com.tr için A kaydını ve MX kayıtlarını 2 gün önce güncelledim. Global olarak birçok DNS checker'dan kontrol ettim, hâlâ eski IP'yi gösteriyor.</p>

<p>Yaptığım değişiklikler:</p>
<ul>
  <li>A kaydı: 94.55.x.x → 185.92.x.x</li>
  <li>MX kaydı: mail.eski-sunucu.com → mail.novanet.com.tr</li>
  <li>TTL: 3600 olarak ayarlandı</li>
</ul>

<p>Nameserver'larınızı kullanıyorum: <code>ns1.hostpanel.com.tr</code> ve <code>ns2.hostpanel.com.tr</code></p>`,
      status: "InProgress",
      priority: "Normal",
      creatorId: user2.id,
      assigneeId: support3.id,
      categoryId: catDomain.id,
      createdAt: ago(2880),
      updatedAt: ago(480),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Merhaba Zeynep Hanım, DNS kayıtlarını panelimizden kontrol ettim. A kaydı doğru görünüyor, ancak eski TTL değeriniz 86400 (24 saat) olarak kayıtlıydı.</p><p>TTL süresini değiştirmeden önce önbellekteki eski kayıtların temizlenmesi gerekiyordu. Şu an nameserver'larımız doğru kaydı yayıyor. Farklı bölgelerden propagasyon tamamlanması için 12-24 saat daha bekleyin.</p>`,
      authorId: support3.id,
      ticketId: t4.id,
      createdAt: ago(2700),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Anladım, peki MX kayıtları da aynı şekilde mi gecikmeli yayılır? Mail trafiğimiz etkileniyor.</p>`,
      authorId: user2.id,
      ticketId: t4.id,
      createdAt: ago(2600),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>MX kayıtları için aynı durum geçerli. Mail sunucunuzu geçiş sürecinde korumak için eski MX kaydını birkaç gün daha aktif tutmanızı öneririm. İki MX kaydını öncelik sırasıyla tutarak geçiş yapabilirsiniz:</p>
<pre><code>MX 10 mail.novanet.com.tr
MX 20 mail.eski-sunucu.com</code></pre>
<p>Bu sayede geçiş tamamlanana kadar mail kaybı yaşamazsınız.</p>`,
      authorId: support3.id,
      ticketId: t4.id,
      createdAt: ago(480),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t4.id, userId: user2.id, action: "ticket_created", createdAt: ago(2880) },
      { ticketId: t4.id, userId: support3.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Selin Çelik", createdAt: ago(2800) },
      { ticketId: t4.id, userId: support3.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(2800) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 5 — Kurumsal mail spam'e düşüyor (Yüksek / İşlemde)
  // ═══════════════════════════════════════════════════════════════════════════
  const t5 = await prisma.ticket.create({
    data: {
      title: "Gönderdiğimiz kurumsal e-postalar alıcılarda spam'e düşüyor",
      description: `<p>eticaretplus.com alan adından gönderdiğimiz tüm e-postalar Gmail ve Outlook kullanıcılarında spam/gereksiz posta klasörüne düşüyor.</p>

<p>Müşterilerimize fatura ve sipariş bildirimi gönderiyoruz, bu durum iş süreçlerimizi ciddi şekilde etkiliyor.</p>

<p>Kontrol ettiklerim:</p>
<ul>
  <li>SPF kaydı mevcut ama doğru mu bilmiyorum</li>
  <li>DKIM hakkında bilgim yok, nasıl kontrol ederim?</li>
  <li>DMARC kaydı yok</li>
</ul>`,
      status: "InProgress",
      priority: "High",
      creatorId: user3.id,
      assigneeId: support3.id,
      categoryId: catEmail.id,
      createdAt: ago(1440),
      updatedAt: ago(240),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Emre Bey, merhaba. E-posta güvenilirlik kayıtlarınızı kontrol ettim:</p>
<ul>
  <li>✅ SPF kaydı mevcut ancak <code>~all</code> yerine <code>-all</code> kullanmanızı öneririm</li>
  <li>❌ DKIM kaydı yok — bu spam'e düşmenin ana sebebi</li>
  <li>❌ DMARC kaydı yok</li>
</ul>
<p>DKIM anahtarını sunucunuzda oluşturuyorum. Birkaç dakika içinde DNS paneline eklemeniz gereken kaydı paylaşacağım.</p>`,
      authorId: support3.id,
      ticketId: t5.id,
      createdAt: ago(1380),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Harika, bekliyorum. DNS panelinde nereden ekleyeceğimi de anlatır mısınız?</p>`,
      authorId: user3.id,
      ticketId: t5.id,
      createdAt: ago(1350),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>DKIM anahtarı hazır. DNS panelinizdeki <strong>TXT kayıtları</strong> bölümüne şunu ekleyin:</p>
<pre><code>Ad: mail._domainkey.eticaretplus.com
Değer: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBA...</code></pre>
<p>DMARC için de şu kaydı ekleyin:</p>
<pre><code>Ad: _dmarc.eticaretplus.com
Değer: v=DMARC1; p=quarantine; rua=mailto:dmarc@eticaretplus.com</code></pre>
<p>Kayıtlar yayıldıktan sonra (6-12 saat) test maili atıp sonucu bildirin.</p>`,
      authorId: support3.id,
      ticketId: t5.id,
      createdAt: ago(240),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t5.id, userId: user3.id, action: "ticket_created", createdAt: ago(1440) },
      { ticketId: t5.id, userId: support3.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Selin Çelik", createdAt: ago(1400) },
      { ticketId: t5.id, userId: support3.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(1400) },
      { ticketId: t5.id, userId: admin.id, action: "priority_changed", field: "Öncelik", oldValue: "Normal", newValue: "Yüksek", createdAt: ago(1390) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 6 — Hosting planı yükseltme faturası (Çözüldü)
  // ═══════════════════════════════════════════════════════════════════════════
  const t6 = await prisma.ticket.create({
    data: {
      title: "Business Hosting'den VPS'e geçişte çift fatura kesildi",
      description: `<p>Business Hosting X5 paketimden VPS Pro paketine geçiş yaptım. Ödeme sayfasında yalnızca fark tutarını ödeyeceğimi gösterdi, ancak kredi kartıma her iki paketin tam tutarı ayrı ayrı yansıdı.</p>

<ul>
  <li>Business Hosting X5 yıllık ücreti: 2.400 TL</li>
  <li>VPS Pro yıllık ücreti: 6.000 TL</li>
  <li>Kart hareketleri: 2.400 TL + 6.000 TL = 8.400 TL tahsil edildi</li>
  <li>Beklenen: Yalnızca 3.600 TL fark</li>
</ul>

<p>2.400 TL'nin iadesi için talepte bulunuyorum.</p>`,
      status: "Resolved",
      priority: "High",
      creatorId: user1.id,
      assigneeId: support4.id,
      categoryId: catFatura.id,
      createdAt: ago(10080),
      updatedAt: ago(7200),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Ahmet Bey, merhaba. Ödeme kayıtlarınızı inceledim. Plan geçiş sürecinde sistemde bir hata yaşandığını doğruladım — eski paket otomatik iptal edilmesi gerekirken fatura kesilmiş.</p><p>2.400 TL iade talebinizi muhasebe birimine ilettim. Onay süreci 1-2 iş günü sürebilir.</p>`,
      authorId: support4.id,
      ticketId: t6.id,
      createdAt: ago(9800),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Teşekkürler. İade onaylandığında bildirim alacak mıyım?</p>`,
      authorId: user1.id,
      ticketId: t6.id,
      createdAt: ago(9700),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>İade onaylandı ve işleme alındı. Kayıt e-postanıza bildirim gönderildi. 3-5 iş günü içinde kartınıza yansır. Anlayışınız için teşekkür ederiz.</p>`,
      authorId: support4.id,
      ticketId: t6.id,
      createdAt: ago(7200),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t6.id, userId: user1.id, action: "ticket_created", createdAt: ago(10080) },
      { ticketId: t6.id, userId: support4.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Murat Kaya", createdAt: ago(10000) },
      { ticketId: t6.id, userId: support4.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(10000) },
      { ticketId: t6.id, userId: support4.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Çözüldü", createdAt: ago(7200) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 7 — WordPress site yavaş (Normal / Açık)
  // ═══════════════════════════════════════════════════════════════════════════
  const t7 = await prisma.ticket.create({
    data: {
      title: "WordPress sitemiz çok yavaş yükleniyor, GTmetrix F notu veriyor",
      description: `<p>eticaretplus.com sitesi yaklaşık 2 haftadır çok yavaş yükleniyor. GTmetrix'ten test ettiğimde F notu alıyorum, yükleme süresi 12 saniyeyi buluyor.</p>

<p>Site özelliklerimiz:</p>
<ul>
  <li>Hosting: Business Hosting X3 (paylaşımlı)</li>
  <li>CMS: WordPress 6.5</li>
  <li>Aktif eklenti sayısı: 34</li>
  <li>Ziyaretçi: günlük ~800</li>
</ul>

<p>Önbellek eklentisi (W3 Total Cache) kurulu ama etkisi yok gibi. Ne yapmalıyım?</p>`,
      status: "Open",
      priority: "Normal",
      creatorId: user3.id,
      categoryId: catPerformans.id,
      createdAt: ago(720),
      updatedAt: ago(720),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t7.id, userId: user3.id, action: "ticket_created", createdAt: ago(720) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 8 — Wildcard SSL kurulumu (Normal / Açık)
  // ═══════════════════════════════════════════════════════════════════════════
  const t8 = await prisma.ticket.create({
    data: {
      title: "Wildcard SSL sertifikası nasıl kurulur? (*.novanet.com.tr)",
      description: `<p>novanet.com.tr ve tüm alt alanları için (api.novanet.com.tr, panel.novanet.com.tr, cdn.novanet.com.tr) tek bir wildcard SSL sertifikası kullanmak istiyorum.</p>

<p>Plesk panelinden denedim ancak DNS-01 doğrulama adımında takıldım. Sizin nameserver'larınızı kullanıyorum, bu doğrulamayı siz taraftan otomatik yapabilir misiniz?</p>

<p>Veya ücretli bir wildcard SSL satın almam mı gerekiyor?</p>`,
      status: "Open",
      priority: "Normal",
      creatorId: user2.id,
      categoryId: catSSL.id,
      createdAt: ago(360),
      updatedAt: ago(360),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t8.id, userId: user2.id, action: "ticket_created", createdAt: ago(360) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 9 — cPanel disk kotası doldu (Yüksek / İşlemde)
  // ═══════════════════════════════════════════════════════════════════════════
  const t9 = await prisma.ticket.create({
    data: {
      title: "cPanel disk kotam doldu, yeni dosya yükleyemiyorum",
      description: `<p>cPanel'de disk kullanımım %100'e ulaştı. Yeni dosya yüklemeye ya da veritabanına kayıt eklemeye çalıştığımda hata alıyorum.</p>

<p>Hata mesajı: <code>No space left on device</code></p>

<p>Mevcut paketim Business Hosting X3 (20 GB). Hangi dosyaların en fazla yer kapladığını görmek istiyorum ama cPanel'deki disk kullanım aracı çok yavaş çalışıyor.</p>

<p>Hemen üst pakete geçmek zorunda mıyım, yoksa gereksiz dosyaları temizleyip devam edebilir miyim?</p>`,
      status: "InProgress",
      priority: "High",
      creatorId: user1.id,
      assigneeId: support2.id,
      categoryId: catHosting.id,
      createdAt: ago(480),
      updatedAt: ago(60),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Ahmet Bey, hesabınızdaki disk kullanımını sunucu tarafından inceledim. En fazla yer kaplayan dizinler:</p>
<ul>
  <li><strong>public_html/wp-content/uploads</strong>: 14.2 GB — Optimize edilmemiş görseller</li>
  <li><strong>mail</strong>: 3.1 GB — Birikmiş e-posta arşivi</li>
  <li><strong>logs</strong>: 1.8 GB — Eski erişim logları</li>
  <li>Toplam boş alan: 0 MB</li>
</ul>
<p>Uploads klasöründeki görselleri WebP formatına çevirirseniz %60-70 yer kazanabilirsiniz. Mail arşivi için eski e-postaları yerel bilgisayarınıza indirip sunucudan silebilirsiniz.</p>`,
      authorId: support2.id,
      ticketId: t9.id,
      createdAt: ago(400),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Log dosyalarını temizleyebilir misiniz, onlar için yetkimi yok gibi görünüyor? Görsel optimizasyon için bir eklenti var mı önerebileceğiniz?</p>`,
      authorId: user1.id,
      ticketId: t9.id,
      createdAt: ago(350),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Log dosyalarını temizledim, 1.8 GB alan açıldı. Artık çalışabilirsiniz.</p>
<p>Görsel optimizasyon için <strong>Imagify</strong> veya <strong>ShortPixel</strong> eklentilerini öneririm, ikisi de ücretsiz başlangıç planı sunuyor. Uzun vadede X5 pakete geçmeyi düşünebilirsiniz (50 GB).</p>`,
      authorId: support2.id,
      ticketId: t9.id,
      createdAt: ago(60),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t9.id, userId: user1.id, action: "ticket_created", createdAt: ago(480) },
      { ticketId: t9.id, userId: support2.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Burak Doğan", createdAt: ago(460) },
      { ticketId: t9.id, userId: support2.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(460) },
      { ticketId: t9.id, userId: admin.id, action: "priority_changed", field: "Öncelik", oldValue: "Normal", newValue: "Yüksek", createdAt: ago(455) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 10 — PHP sürüm yükseltme sonrası site çöktü (Acil / Çözüldü)
  // ═══════════════════════════════════════════════════════════════════════════
  const t10 = await prisma.ticket.create({
    data: {
      title: "PHP 8.2'ye geçince site beyaz ekran verdi",
      description: `<p>cPanel'den PHP sürümünü 7.4'ten 8.2'ye yükselttim. Hemen ardından sitemde beyaz ekran (White Screen of Death) oluştu.</p>

<p>WordPress hata logunda şunu görüyorum:</p>
<pre><code>Fatal error: Uncaught TypeError: implode(): Argument #1 ($array) must be of type array, string given in /home/user/public_html/wp-content/plugins/eski-eklenti/functions.php on line 247</code></pre>

<p>PHP sürümünü 7.4'e geri döndürdüm ama artık cPanel'de bu seçenek görünmüyor!</p>`,
      status: "Resolved",
      priority: "Urgent",
      creatorId: user3.id,
      assigneeId: support1.id,
      categoryId: catHosting.id,
      createdAt: ago(20160),
      updatedAt: ago(18000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Emre Bey, merhaba. PHP sürümünü sunucu tarafından 7.4'e geri aldım, siteniz şu an çalışıyor olmalı.</p>
<p>PHP 8.2 ile uyumsuz eklentiniz var. Hata mesajındaki <code>eski-eklenti</code> eklentisini PHP 8.x uyumlu bir alternatifle değiştirmeniz ya da güncellemeniz gerekiyor.</p>`,
      authorId: support1.id,
      ticketId: t10.id,
      createdAt: ago(20000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Evet, site açıldı, çok teşekkürler! Eklentiyi güncelledim. Tekrar PHP 8.2'ye geçebilir miyim?</p>`,
      authorId: user3.id,
      ticketId: t10.id,
      createdAt: ago(19500),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Evet, eklenti güncellendiyse güvenle geçebilirsiniz. Geçiş öncesi bir yedek almanızı öneririm (cPanel → Backup Wizard). PHP 8.2'ye geçtikten sonra 15-20 dakika sitenizi test edin.</p>`,
      authorId: support1.id,
      ticketId: t10.id,
      createdAt: ago(19000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Yedek aldım, PHP 8.2'ye geçtim. Her şey sorunsuz çalışıyor. Teşekkürler!</p>`,
      authorId: user3.id,
      ticketId: t10.id,
      createdAt: ago(18200),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t10.id, userId: user3.id, action: "ticket_created", createdAt: ago(20160) },
      { ticketId: t10.id, userId: admin.id, action: "priority_changed", field: "Öncelik", oldValue: "Normal", newValue: "Acil", createdAt: ago(20150) },
      { ticketId: t10.id, userId: support1.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Elif Yıldız", createdAt: ago(20140) },
      { ticketId: t10.id, userId: support1.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(20140) },
      { ticketId: t10.id, userId: support1.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Çözüldü", createdAt: ago(18000) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 11 — Alan adı süresi doluyor (Düşük / Açık)
  // ═══════════════════════════════════════════════════════════════════════════
  const t11 = await prisma.ticket.create({
    data: {
      title: "digitalmedya.com.tr yenileme faturası neden bu kadar pahalı?",
      description: `<p>Alan adı yenileme faturam geldi, geçen yıla göre %40 zam yapılmış. Fiyat değişikliği hakkında önceden bildirim almadım.</p>

<ul>
  <li>2023 yenileme: 450 TL</li>
  <li>2024 yenileme faturası: 630 TL</li>
</ul>

<p>Bu fiyat doğru mu? Daha uygun bir yenileme seçeneği var mı?</p>`,
      status: "Open",
      priority: "Low",
      creatorId: user1.id,
      categoryId: catFatura.id,
      createdAt: ago(1080),
      updatedAt: ago(1080),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t11.id, userId: user1.id, action: "ticket_created", createdAt: ago(1080) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 12 — SMTP bağlantısı kurulamıyor (Yüksek / Beklemede)
  // ═══════════════════════════════════════════════════════════════════════════
  const t12 = await prisma.ticket.create({
    data: {
      title: "Outlook'ta SMTP ayarı yapıyorum bağlanmıyor",
      description: `<p>info@novanet.com.tr kurumsal e-posta hesabımı Outlook 2021'e eklemek istiyorum. SMTP ayarlarını cPanel'den aldım ama bağlantı kurulamıyor.</p>

<p>Kullandığım ayarlar:</p>
<ul>
  <li>SMTP sunucu: mail.novanet.com.tr</li>
  <li>Port: 587 (STARTTLS)</li>
  <li>Kullanıcı adı: info@novanet.com.tr</li>
  <li>Şifre: cPanel e-posta şifresi</li>
</ul>

<p>Hata: <code>Sunucu yanıt vermedi. Zaman aşımı.</code></p>`,
      status: "Waiting",
      priority: "High",
      creatorId: user2.id,
      assigneeId: support4.id,
      categoryId: catEmail.id,
      createdAt: ago(960),
      updatedAt: ago(480),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Zeynep Hanım, merhaba. 587 portu bazı kurumsal ağlarda ISP tarafından engellenebiliyor.</p>
<p>Alternatif olarak şu ayarları deneyin:</p>
<ul>
  <li>Port 465 (SSL/TLS)</li>
  <li>Port 25 (şifresiz — önerilmez)</li>
</ul>
<p>Kurumsal bir ağdan mı bağlanıyorsunuz? IT departmanınızla da kontrol edin.</p>`,
      authorId: support4.id,
      ticketId: t12.id,
      createdAt: ago(900),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Port 465 de denedim, yine olmadı. Evet, şirket ağındayım. IT'ye sorduk, onlar firewall'dan engel olmadığını söyledi.</p>`,
      authorId: user2.id,
      ticketId: t12.id,
      createdAt: ago(850),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Sunucu tarafında mail.novanet.com.tr için port erişimini test ettim — dışarıdan erişilebilir durumda. Sorun Outlook yapılandırmasında olabilir.</p>
<p>IT departmanınızdan gelen bağlantı logunu talep ettim, inceleme yapıyorum. Sonuç gelir gelmez döneceğim.</p>`,
      authorId: support4.id,
      ticketId: t12.id,
      createdAt: ago(480),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t12.id, userId: user2.id, action: "ticket_created", createdAt: ago(960) },
      { ticketId: t12.id, userId: support4.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Murat Kaya", createdAt: ago(940) },
      { ticketId: t12.id, userId: support4.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(940) },
      { ticketId: t12.id, userId: support4.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Beklemede", createdAt: ago(480) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 13 — Otomatik yedekleme ayarı (Düşük / Çözüldü)
  // ═══════════════════════════════════════════════════════════════════════════
  const t13 = await prisma.ticket.create({
    data: {
      title: "Otomatik yedekleme nasıl aktif edilir?",
      description: `<p>Hosting paketimde otomatik günlük yedekleme özelliği var mı? cPanel'de Backup Wizard'ı gördüm ama otomatik zamanlama seçeneğini bulamadım.</p>

<p>Özellikle veritabanı yedeklerinin her gece alınmasını istiyorum.</p>`,
      status: "Resolved",
      priority: "Low",
      creatorId: user1.id,
      assigneeId: support4.id,
      categoryId: catHosting.id,
      createdAt: ago(14400),
      updatedAt: ago(13500),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Ahmet Bey, Business Hosting paketinizde günlük otomatik yedekleme varsayılan olarak aktif. Yedekler <strong>cPanel → Backup → Restore a Full Backup</strong> bölümünden erişilebilir.</p>
<p>Ayrıca ekstra güvenlik için <strong>JetBackup</strong> aracından anlık yedek alabilirsiniz. cPanel ana ekranında JetBackup simgesine tıklayın.</p>`,
      authorId: support4.id,
      ticketId: t13.id,
      createdAt: ago(14200),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Buldum, teşekkürler! JetBackup'tan veritabanı yedeği aldım, çok pratik bir araç.</p>`,
      authorId: user1.id,
      ticketId: t13.id,
      createdAt: ago(13500),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t13.id, userId: user1.id, action: "ticket_created", createdAt: ago(14400) },
      { ticketId: t13.id, userId: support4.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Murat Kaya", createdAt: ago(14350) },
      { ticketId: t13.id, userId: support4.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(14350) },
      { ticketId: t13.id, userId: support4.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Çözüldü", createdAt: ago(13500) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 14 — DDoS saldırısı şüphesi (Acil / Kapatıldı)
  // ═══════════════════════════════════════════════════════════════════════════
  const t14 = await prisma.ticket.create({
    data: {
      title: "Sitemiz DDoS saldırısına uğruyor olabilir, trafik anormal",
      description: `<p>eticaretplus.com sitesi dün gece 23:00-02:00 arasında tamamen erişilemez oldu. Google Analytics'te aynı saatte saniyede 500+ istek görüyorum, bu normale göre 50 kat fazla.</p>

<p>Cloudflare kullanmıyorum. Sunucunuzda DDoS koruması var mı? Bu trafik engellenebilir mi?</p>

<p>Önemli not: Gece boyunca sipariş alamamış olabiliriz, ciddi maddi kayıp söz konusu.</p>`,
      status: "Closed",
      priority: "Urgent",
      creatorId: user3.id,
      assigneeId: support2.id,
      categoryId: catHosting.id,
      createdAt: ago(43200),
      updatedAt: ago(40000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Emre Bey, sunucu loglarını inceledim. Tespitlerim:</p>
<ul>
  <li>Saldırı 22:47'de başlamış, 02:15'te sona ermiş</li>
  <li>Kaynak: 12 farklı ülkeden 3.000+ benzersiz IP</li>
  <li>Saldırı türü: HTTP Flood (Layer 7)</li>
</ul>
<p>Şu an için IP bazlı engelleme uyguladım ve rate limiting devreye aldım. Kalıcı çözüm için Cloudflare entegrasyonu öneriyorum, yönlendirmede yardımcı olabilirim.</p>`,
      authorId: support2.id,
      ticketId: t14.id,
      createdAt: ago(43000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Cloudflare hakkında bilgim yok ama kurulumda yardımcı olursanız memnuniyet duyarım. Ücretsiz planı yeterli olur mu?</p>`,
      authorId: user3.id,
      ticketId: t14.id,
      createdAt: ago(42500),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Cloudflare ücretsiz plan DDoS koruması için büyük ölçüde yeterli. DNS kayıtlarınızı Cloudflare'e taşıdım ve proxy modunu aktif ettim. Siteniz artık Cloudflare üzerinden servis ediliyor.</p>
<p>Son 24 saatte 47.000 kötü amaçlı istek engellendi. Siteniz stabil çalışıyor.</p>`,
      authorId: support2.id,
      ticketId: t14.id,
      createdAt: ago(40500),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Harika, çok teşekkürler! Site şimdi çok daha hızlı da açılıyor. Talebi kapatabilirsiniz.</p>`,
      authorId: user3.id,
      ticketId: t14.id,
      createdAt: ago(40200),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t14.id, userId: user3.id, action: "ticket_created", createdAt: ago(43200) },
      { ticketId: t14.id, userId: admin.id, action: "priority_changed", field: "Öncelik", oldValue: "Yüksek", newValue: "Acil", createdAt: ago(43180) },
      { ticketId: t14.id, userId: support2.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Burak Doğan", createdAt: ago(43150) },
      { ticketId: t14.id, userId: support2.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(43150) },
      { ticketId: t14.id, userId: admin.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Kapatıldı", createdAt: ago(40000) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TALEP 15 — .htaccess ile yönlendirme (Düşük / Çözüldü)
  // ═══════════════════════════════════════════════════════════════════════════
  const t15 = await prisma.ticket.create({
    data: {
      title: "www olmayan adresi www'ye yönlendirmek istiyorum",
      description: `<p>novanet.com.tr adresine girildiğinde otomatik olarak www.novanet.com.tr'ye yönlendirme yapmak istiyorum. .htaccess dosyasını düzenlemeyi denedim ama çalışmadı.</p>

<p>Mevcut .htaccess içeriğim:</p>
<pre><code>RewriteEngine On
RewriteCond %{HTTP_HOST} !^www\.
RewriteRule ^(.*)$ http://www.%{HTTP_HOST}/$1 [R=301,L]</code></pre>

<p>Tarayıcıda yine de yönlendirme çalışmıyor.</p>`,
      status: "Resolved",
      priority: "Low",
      creatorId: user2.id,
      assigneeId: support3.id,
      categoryId: catDomain.id,
      createdAt: ago(21600),
      updatedAt: ago(20000),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Zeynep Hanım, sorun HTTPS kullanımından kaynaklanıyor. Mevcut kuralınız HTTP için yazılmış. SSL aktif olduğu için kuralı şu şekilde güncellemeniz gerekiyor:</p>
<pre><code>RewriteEngine On
RewriteCond %{HTTP_HOST} !^www\. [NC]
RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [R=301,L]</code></pre>
<p>Bu değişikliği .htaccess dosyanıza uygulayıp test edebilirsiniz.</p>`,
      authorId: support3.id,
      ticketId: t15.id,
      createdAt: ago(21400),
    },
  });

  await prisma.comment.create({
    data: {
      content: `<p>Mükemmel, çalıştı! Teşekkürler.</p>`,
      authorId: user2.id,
      ticketId: t15.id,
      createdAt: ago(20000),
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      { ticketId: t15.id, userId: user2.id, action: "ticket_created", createdAt: ago(21600) },
      { ticketId: t15.id, userId: support3.id, action: "assignee_changed", field: "Atanan", oldValue: null, newValue: "Selin Çelik", createdAt: ago(21500) },
      { ticketId: t15.id, userId: support3.id, action: "status_changed", field: "Durum", oldValue: "Açık", newValue: "İşlemde", createdAt: ago(21500) },
      { ticketId: t15.id, userId: support3.id, action: "status_changed", field: "Durum", oldValue: "İşlemde", newValue: "Çözüldü", createdAt: ago(20000) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BİLDİRİMLER
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      { userId: user1.id, ticketId: t1.id, type: "status_changed", message: '"SSL sertifikası yenilenmedi" talebinin durumu güncellendi: İşlemde', isRead: false, createdAt: ago(165) },
      { userId: user1.id, ticketId: t1.id, type: "comment_added", message: 'Elif Yıldız "SSL sertifikası yenilenmedi" talebine yorum yaptı', isRead: false, createdAt: ago(30) },
      { userId: user2.id, ticketId: t2.id, type: "status_changed", message: '"novanet.com.tr domain transferi" talebinin durumu Beklemede olarak güncellendi', isRead: true, createdAt: ago(1440) },
      { userId: user3.id, ticketId: t3.id, type: "ticket_assigned", message: '"VPS sunucuya SSH ile bağlanamıyorum" talebi Elif Yıldız\'a atandı', isRead: false, createdAt: ago(290) },
      { userId: user3.id, ticketId: t3.id, type: "comment_added", message: 'Elif Yıldız VPS talebinize yorum yaptı', isRead: false, createdAt: ago(20) },
      { userId: user1.id, ticketId: t6.id, type: "status_changed", message: '"Çift fatura" talebiniz çözüldü', isRead: true, createdAt: ago(7200) },
      { userId: user3.id, ticketId: t5.id, type: "comment_added", message: 'Selin Çelik "E-postalar spam\'e düşüyor" talebinize DKIM ayarlarını paylaştı', isRead: false, createdAt: ago(240) },
      { userId: admin.id, ticketId: t1.id, type: "ticket_created", message: 'Yeni acil talep: "SSL sertifikası yenilenmedi" — Ahmet Demir', isRead: false, createdAt: ago(180) },
      { userId: admin.id, ticketId: t3.id, type: "ticket_created", message: 'Yeni acil talep: "VPS sunucuya SSH ile bağlanamıyorum" — Emre Aydın', isRead: false, createdAt: ago(300) },
      { userId: support1.id, ticketId: t1.id, type: "ticket_assigned", message: '"SSL sertifikası yenilenmedi" talebi size atandı', isRead: true, createdAt: ago(170) },
    ],
  });

  console.log("15 talep, yorumlar, geçmiş kayıtları ve bildirimler oluşturuldu");
  console.log("Seed işlemi tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
