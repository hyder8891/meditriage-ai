import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
export default function AdminDashboard() {
  // TODO: Connect to real backend stats
  const patientsCount = { count: 1247 };
  const doctorsCount = { count: 89 };
  const systemHealth = { status: 'healthy', uptime: '99.9%' };

  const stats = [
    {
      title: 'Total Patients',
      value: patientsCount?.count || 0,
      icon: Users,
      description: 'Registered patients',
      trend: '+12% from last month',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Doctors',
      value: doctorsCount?.count || 0,
      icon: UserCog,
      description: 'Active clinicians',
      trend: '+5% from last month',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'System Health',
      value: systemHealth?.status || 'Checking...',
      icon: systemHealth?.status === 'healthy' ? CheckCircle : AlertCircle,
      description: 'All services operational',
      trend: systemHealth?.uptime || 'N/A',
      color: systemHealth?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500',
      bgColor: systemHealth?.status === 'healthy' ? 'bg-green-500/10' : 'bg-yellow-500/10',
    },
    {
      title: 'Active Sessions',
      value: '247',
      icon: Activity,
      description: 'Current active users',
      trend: 'Real-time',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">
            System overview and management console
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {stat.description}
                  </p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-slate-400">{stat.trend}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-slate-400">
                Latest system events and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: 'New patient registration', time: '2 minutes ago', type: 'info' },
                  { event: 'Doctor approved', time: '15 minutes ago', type: 'success' },
                  { event: 'System backup completed', time: '1 hour ago', type: 'success' },
                  { event: 'High load detected', time: '2 hours ago', type: 'warning' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm text-slate-300">{activity.event}</span>
                    </div>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
              <CardDescription className="text-slate-400">
                Service health and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { service: 'API Server', status: 'operational', uptime: '99.9%' },
                  { service: 'Database', status: 'operational', uptime: '99.8%' },
                  { service: 'AI Services', status: 'operational', uptime: '99.5%' },
                  { service: 'Storage', status: 'operational', uptime: '100%' },
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-slate-300">{service.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{service.uptime}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SecureAdminLayout>
  );
}
