import { motion } from 'framer-motion'
import { GraduationCap, Tag, Heart, Coffee, Instagram, Facebook, Twitter } from 'lucide-react'

export default function MenuFooter() {
  const mottos = [
    {
      icon: GraduationCap,
      title: "Öğrenci Dostu",
      description: "Özel fiyatlarla her zaman yanınızdayız"
    },
    {
      icon: Tag,
      title: "Kampanyanın Tek Adresi",
      description: "Her gün yeni fırsatlar"
    },
    {
      icon: Heart,
      title: "Karabükte Düzenli İkramın Tek Adresi",
      description: "Sürekli ikramlarımızla sizi mutlu ediyoruz"
    }
  ]

  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/meva.pastacafe", label: "Instagram" }
  ]

  return (
    <footer className="relative z-10 mt-16 border-t border-emerald-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Mottos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {mottos.map((motto, index) => {
            const IconComponent = motto.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-2">
                  {motto.title}
                </h3>
                <p className="text-sm text-emerald-600 font-medium">
                  {motto.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-emerald-200 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div className="text-emerald-800">
              <p className="font-bold text-lg">MEVA CAFE</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon
              return (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-emerald-100 hover:bg-emerald-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                  aria-label={social.label}
                >
                  <IconComponent className="w-5 h-5 text-emerald-700" />
                </motion.a>
              )
            })}
          </div>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
         <p className="text-xs text-gray-600 flex items-center justify-center gap-2 mt-4">
  <span>© 2025 Tüm Hakları Saklıdır</span>
  <span className="text-gray-400">•</span>
  <a 
    href="https://ardacaliskan.com"
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
  >
    Arda Çalışkan
  </a>
</p>

        </motion.div>
      </div>
    </footer>
  )
}