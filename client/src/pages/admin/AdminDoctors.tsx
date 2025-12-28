import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Edit, Trash2, Eye, Download, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function AdminDoctors() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();
  
  const doctors = users?.filter(u => u.role === 'clinician') || [];

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (id: number) => {
    toast.success('Doctor approved successfully');
    refetch();
  };

  const handleReject = async (id: number) => {
    if (confirm('Are you sure you want to reject this doctor?')) {
      toast.success('Doctor rejected');
      refetch();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      toast.success('Doctor deleted successfully');
      refetch();
    }
  };

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Doctor Management</h1>
            <p className="text-slate-400">View, approve, and manage healthcare providers</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Total Doctors</CardDescription>
              <CardTitle className="text-3xl text-white">{doctors.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Verified</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {doctors.filter(d => d.emailVerified).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Pending Approval</CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {doctors.filter(d => !d.emailVerified).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Active Today</CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {doctors.filter(d => {
                  const lastActive = new Date(d.lastSignedIn || 0);
                  const today = new Date();
                  return lastActive.toDateString() === today.toDateString();
                }).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Table */}
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
              <div className="text-center py-8 text-slate-400">Loading doctors...</div>
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
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id} className="border-slate-800">
                      <TableCell className="text-slate-300">{doctor.id}</TableCell>
                      <TableCell className="text-white font-medium">{doctor.name || 'N/A'}</TableCell>
                      <TableCell className="text-slate-300">{doctor.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={doctor.emailVerified ? 'default' : 'secondary'} 
                          className={doctor.emailVerified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}
                        >
                          {doctor.emailVerified ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {doctor.lastSignedIn ? new Date(doctor.lastSignedIn).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!doctor.emailVerified && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-green-400 hover:text-green-300"
                                onClick={() => handleApprove(doctor.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-yellow-400 hover:text-yellow-300"
                                onClick={() => handleReject(doctor.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
                            onClick={() => handleDelete(doctor.id)}
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
            {!isLoading && filteredDoctors.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No doctors found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
