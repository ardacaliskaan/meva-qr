# Restaurant QR Menu System

Modern, profesyonel QR menü yönetim sistemi. Restoran işletmecileri için tasarlanmış tam kapsamlı dijital menü çözümü.

## Özellikler

### 🔐 Admin Yönetimi
- Güvenli admin girişi
- Session-based authentication
- Role-based erişim kontrolü

### 📂 Kategori Yönetimi
- Hiyerarşik kategori yapısı (ana/alt kategoriler)
- Görsel destekli kategoriler
- Sıralama ve aktiflik durumu yönetimi
- Sürükle-bırak desteği

### 🧄 Malzeme Yönetimi
- 8 farklı malzeme kategorisi
- Alerjen bilgi sistemi
- Diyet etiketleri (vegan, vejetaryen, glutensiz)
- Ekstra fiyat belirleme

### 🍕 Gelişmiş Menü Yönetimi
- 4 sekmeli form sistemi:
  - **Temel Bilgiler**: Ad, açıklama, fiyat, kategori
  - **Malzemeler**: Ürün içeriği seçimi
  - **Özelleştirme**: Çıkarılabilir/ekstra malzemeler
  - **Beslenme & Diyet**: Kalori, alerjen, diyet bilgileri
- Profesyonel fotoğraf upload sistemi
- Acılık seviyesi ve hazırlama süresi

### 📱 QR Kod Sistemi
- Masa bazlı QR kod üretimi
- Toplu QR kod oluşturma
- Yazdırma özelliği
- Custom URL desteği

### 🛒 Sipariş Yönetimi
- Real-time sipariş takibi
- Masa bazlı sipariş alma
- Durum güncellemeleri (Bekliyor → Hazırlanıyor → Hazır → Teslim)
- Sipariş geçmişi

### 📊 Dashboard
- Günlük istatistikler
- Aktif masa sayısı
- Ciro takibi
- Son siparişler

## Teknoloji Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: Session-based
- **Image Upload**: Local file system

## Kurulum

### Gereksinimler
- Node.js 18+
- MongoDB
- npm veya yarn

### 1. Repo'yu klonlayın
```bash
git clone https://github.com/username/restaurant-qr-menu.git
cd restaurant-qr-menu
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın
`.env.local` dosyası oluşturun:
```
MONGODB_URI=mongodb://localhost:27017/restaurant-qr
```

### 4. MongoDB'yi başlatın
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. Demo verilerini yükleyin
```bash
node scripts/seed.js
```

### 6. Geliştirme sunucusunu başlatın
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacak.

## Admin Giriş Bilgileri

- **Kullanıcı Adı**: admin
- **Şifre**: admin123

## Proje Yapısı

```
restaurant-qr-menu/
├── .gitignore
├── README.md
├── package.json
├── jsconfig.json
├── eslint.config.mjs
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.mjs
├── scripts/
│   └── seed.js                # Demo veri script'i
├── public/
│   └── uploads/               # Yüklenen resimler
├── src/
│   ├── app/
│   │   ├── globals.css        # Global stiller
│   │   ├── layout.js          # Root layout
│   │   ├── page.js            # Ana sayfa
│   │   ├── login/             # Admin giriş
│   │   │   └── page.js
│   │   ├── menu/              # Müşteri menüsü
│   │   │   └── [tableId]/
│   │   │       └── page.js
│   │   ├── admin/             # Admin panel
│   │   │   ├── layout.js      # Admin layout
│   │   │   ├── page.js        # Dashboard
│   │   │   ├── categories/    # Kategori yönetimi
│   │   │   │   └── page.js
│   │   │   ├── ingredients/   # Malzeme yönetimi
│   │   │   │   └── page.js
│   │   │   ├── menu/          # Menü yönetimi
│   │   │   │   └── page.js
│   │   │   ├── orders/        # Sipariş yönetimi
│   │   │   │   └── page.js
│   │   │   └── qr/            # QR kod üreticisi
│   │   │       └── page.js
│   │   └── api/               # API endpoints
│   │       ├── auth/          # Authentication
│   │       │   ├── login/
│   │       │   ├── logout/
│   │       │   └── verify/
│   │       ├── menu/          # Müşteri menü API
│   │       ├── orders/        # Sipariş API
│   │       ├── upload/        # Resim upload API
│   │       └── admin/         # Admin API'leri
│   │           ├── categories/
│   │           ├── ingredients/
│   │           └── menu/
│   ├── components/            # Reusable components
│   │   ├── AuthGuard.js       # Authentication guard
│   │   └── ImageUpload.js     # Resim upload komponenti
│   └── lib/                   # Utility libraries
│       ├── mongodb.js         # Database bağlantısı
│       ├── auth.js            # Authentication utilities
│       └── models/            # Data modelleri
│           └── category.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin girişi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/verify` - Session doğrulama

### Categories
- `GET /api/admin/categories` - Kategorileri listele
- `POST /api/admin/categories` - Kategori oluştur
- `PUT /api/admin/categories` - Kategori güncelle
- `DELETE /api/admin/categories` - Kategori sil

### Ingredients
- `GET /api/admin/ingredients` - Malzemeleri listele
- `POST /api/admin/ingredients` - Malzeme oluştur
- `PUT /api/admin/ingredients` - Malzeme güncelle
- `DELETE /api/admin/ingredients` - Malzeme sil

### Menu
- `GET /api/menu` - Müşteri menüsü
- `GET /api/admin/menu` - Admin menü listesi
- `POST /api/admin/menu` - Ürün oluştur
- `PUT /api/admin/menu` - Ürün güncelle
- `DELETE /api/admin/menu` - Ürün sil

### Orders
- `GET /api/orders` - Sipariş listesi
- `POST /api/orders` - Sipariş oluştur
- `PUT /api/orders` - Sipariş güncelle

### Upload
- `POST /api/upload` - Resim yükleme
- `DELETE /api/upload` - Resim silme

## Kullanım

### 1. Admin Panel
http://localhost:3000/admin adresinde admin paneline erişin.

### 2. Menü Görüntüleme
http://localhost:3000/menu/[masa-numarası] formatında müşteri menüsüne erişim.

### 3. QR Kod Oluşturma
Admin panelden QR kod sekmesine giderek masa bazlı QR kodlar oluşturun.

## Geliştirme Planı

### Yakında Eklenecek Özellikler
- Masa yönetim sistemi
- Adisyon ve fatura sistemi
- Müşteri menüsü tasarım iyileştirmeleri
- Raporlama sistemi
- Çok dilli destek

### Gelecek Güncellemeler
- Push notifications
- Online ödeme entegrasyonu
- Stok takip sistemi
- Müşteri geri bildirimi

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Destek

Herhangi bir sorun için issue açabilir veya email ile iletişime geçebilirsiniz.

---

**Not**: Bu sistem profesyonel restoran kullanımı için tasarlanmıştır. Production ortamında kullanmadan önce güvenlik ayarlarını gözden geçirin.