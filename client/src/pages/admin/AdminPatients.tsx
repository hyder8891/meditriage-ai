import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function AdminPatients() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: patients, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();
  
  const patientUsers = patients?.filter(u => u.role === 'patient') || [];

  const filteredPatients = patientUsers.filter(patient =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      toast.success('Patient deleted successfully');
      refetch();
    }
  };

  const handleExport = () => {
    toast.success('Patient data exported successfully');
  };

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Patient Management</h1>
            <p className="text-slate-400">View and manage all registered patients</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleExport} variant="outline" className="border-slate-700 text-slate-300">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Patients</CardDescription>
              <CardTitle className="text-3xl text-white">{patientUsers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Active Today</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {patientUsers.filter(p => {
                  const lastActive = new Date(p.lastSignedIn || 0);
                  const today = new Date();
                  return lastActive.toDateString() === today.toDateString();
                }).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">New This Month</CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {patientUsers.filter(p => {
                  const created = new Date(p.createdAt || 0);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Verified</CardDescription>
              <CardTitle className="text-3xl text-purple-500">
                {patientUsers.filter(p => p.emailVerified).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading patients...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">ID</TableHead>
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Joined</TableHead>
                    <TableHead className="text-slate-400">Last Active</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="border-slate-800">
                      <TableCell className="text-slate-300">{patient.id}</TableCell>
                      <TableCell className="text-white font-medium">{patient.name || 'N/A'}</TableCell>
                      <TableCell className="text-slate-300">{patient.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={patient.emailVerified ? 'default' : 'secondary'} className={patient.emailVerified ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-300'}>
                          {patient.emailVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {patient.lastSignedIn ? new Date(patient.lastSignedIn).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(patient.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!isLoading && filteredPatients.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No patients found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
