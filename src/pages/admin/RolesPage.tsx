import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Role = Database['public']['Tables']['roles']['Row'];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: {},
    is_system_role: false,
    updated_at: new Date().toISOString(),
  });

  // Fetch roles
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => deleteRecord('roles', roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting role: ${error.message}`);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (roleData: { id: string; data: Partial<Role> }) => 
      updateRecord('roles', roleData.id, roleData.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating role: ${error.message}`);
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData: Omit<Role, 'id' | 'created_at'>) => 
      insertRecord('roles', roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating role: ${error.message}`);
    },
  });

  const columns: Column<Role>[] = [
    { key: 'display_name', header: 'Display Name' },
    {
      key: 'name',
      header: 'Name',
      render: (role) => <code className="text-xs bg-muted px-2 py-1 rounded">{role.name}</code>,
    },
    { key: 'description', header: 'Description' },
    {
      key: 'is_system_role',
      header: 'System Role',
      render: (role) => (
        <Badge variant={role.is_system_role ? 'default' : 'secondary'}>
          {role.is_system_role ? 'System' : 'Custom'}
        </Badge>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({ name: '', display_name: '', description: '', permissions: {}, is_system_role: false, updated_at: new Date().toISOString() });
    setIsDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permissions: role.permissions || {},
      is_system_role: role.is_system_role,
      updated_at: new Date().toISOString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (role.is_system_role) {
      toast.error('Cannot delete system roles');
      return;
    }
    deleteRoleMutation.mutate(role.id);
  };

  const handleSubmit = () => {
    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        data: formData,
      });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Roles</h2>
        <p className="text-muted-foreground">Manage system and custom roles.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading roles...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading roles: {error.message}</div>
      ) : (
        <DataTable
          data={roles}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Role"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="role_name"
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Role Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Role description..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>System Role</Label>
              <Switch
                checked={formData.is_system_role}
                onCheckedChange={(checked) => setFormData({ ...formData, is_system_role: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingRole ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
