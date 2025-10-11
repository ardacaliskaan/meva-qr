'use client'
import { ShoppingBag, Users, TrendingUp, Clock } from 'lucide-react'

export default function AdminDashboard() {
  // Demo veriler
  const stats = [
    { label: 'Bugünkü Siparişler', value: '24', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Aktif Masalar', value: '8', icon: Users, color: 'bg-green-500' },
    { label: 'Günlük Ciro', value: '₺1,240', icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Ortalama Süre', value: '12 dk', icon: Clock, color: 'bg-orange-500' },
  ]

  const recentOrders = [
    { id: 1, table: 5, items: 'Margherita Pizza, Coca Cola', total: '₺54.80', status: 'Hazırlanıyor', time: '10:30' },
    { id: 2, table: 3, items: 'Klasik Burger, Patates', total: '₺45.90', status: 'Tamamlandı', time: '10:25' },
    { id: 3, table: 7, items: 'Pepperoni Pizza', total: '₺52.90', status: 'Yeni', time: '10:35' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Restoran istatistikleri ve özet bilgiler</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Son Siparişler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürünler</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Masa {order.table}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.items}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.total}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Yeni' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Hazırlanıyor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}