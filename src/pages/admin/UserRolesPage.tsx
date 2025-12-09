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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type UserRole = Database['public']['Tables']['user_roles']['Row'];

type UserRoleWithNames = UserRole & {
  userName: string;
  roleName: string;
  assignedByName: string;
};

export default function UserRolesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: '',
    assigned_by: '',
    expires_at: '',
    is_active: true,
  });

  // Fetch user roles with complete user and role data
  const { data: userRoles = [], isLoading, error } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      console.log('Fetching user roles with admin client...');
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });
      
      console.log('User roles query result:', { data, error });
      
      if (error) {
        console.error('User roles query error:', error);
        throw error;
      }
      
      console.log('User roles data length:', data?.length || 0);
      return data || [];
    },
  });

  // Fetch users for dropdown and mapping
  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log('Fetching users for dropdown...');
      const result = await fetchTableData('profiles', 'id, full_name');
      console.log('Users dropdown result:', result);
      return result;
    },
  });

  // Fetch roles for dropdown and mapping
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('Fetching roles for dropdown...');
      const result = await fetchTableData('roles', 'id, name, display_name');
      console.log('Roles dropdown result:', result);
      return result;
    },
  });

  // Create lookup maps for names
  const userMap = users.reduce((acc: Record<string, string>, user: any) => {
    acc[user.id] = user.full_name;
    return acc;
  }, {});

  const roleMap = roles.reduce((acc: Record<string, string>, role: any) => {
    acc[role.id] = role.display_name || role.name;
    return acc;
  }, {});

  // Combine user roles with names
  const userRolesWithNames = userRoles.map(ur => ({
    ...ur,
    userName: userMap[ur.user_id] || 'Unknown User',
    roleName: roleMap[ur.role_id] || 'Unknown Role',
    assignedByName: ur.assigned_by ? (userMap[ur.assigned_by] || 'Unknown User') : 'System',
  }));

  // Delete user role mutation
  const deleteUserRoleMutation = useMutation({
    mutationFn: async (userRoleId: string) => {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('User role deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting user role: ${error.message}`);
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async (userRoleData: { id: string; data: Partial<UserRole> }) => {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .update(userRoleData.data)
        .eq('id', userRoleData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('User role updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating user role: ${error.message}`);
    },
  });

  // Create user role mutation
  const createUserRoleMutation = useMutation({
    mutationFn: async (userRoleData: Omit<UserRole, 'id' | 'assigned_at'>) => {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .insert(userRoleData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('User role created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating user role: ${error.message}`);
    },
  });

  const getUserName = (ur: any) => ur.userName || 'Unknown User';
  const getRoleName = (ur: any) => ur.roleName || 'Unknown Role';
  const getAssignedBy = (ur: any) => ur.assignedByName || 'System';

  const columns: Column<UserRoleWithNames>[] = [
    {
      key: 'user_id',
      header: 'User',
      render: (ur) => (
        <div className="space-y-1">
          <div className="font-medium">{ur.userName}</div>
          <div className="text-xs text-muted-foreground">ID: {ur.user_id}</div>
        </div>
      ),
    },
    {
      key: 'role_id',
      header: 'Role',
      render: (ur) => (
        <div className="space-y-1">
          <Badge variant="secondary">
            {ur.roleName}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Assigned: {new Date(ur.assigned_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'assigned_by',
      header: 'Assigned By',
      render: (ur) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{ur.assignedByName}</div>
          {ur.assigned_by && (
            <div className="text-xs text-muted-foreground">ID: {ur.assigned_by}</div>
          )}
        </div>
      ),
    },
    {
      key: 'assigned_at',
      header: 'Assignment Details',
      render: (ur) => (
        <div className="space-y-1">
          <div className="text-sm">
            Assigned: {new Date(ur.assigned_at).toLocaleDateString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Time: {new Date(ur.assigned_at).toLocaleTimeString()}
          </div>
          {ur.expires_at && (
            <div className="text-xs text-muted-foreground">
              Expires: {new Date(ur.expires_at).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (ur) => (
        <Badge variant={ur.is_active ? 'default' : 'secondary'}>
          {ur.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUserRole(null);
    setFormData({ user_id: '', role_id: '', assigned_by: '', expires_at: '', is_active: true });
    setIsDialogOpen(true);
  };

  const handleEdit = (userRole: UserRole) => {
    setEditingUserRole(userRole);
    setFormData({
      user_id: userRole.user_id,
      role_id: userRole.role_id,
      assigned_by: userRole.assigned_by || '',
      expires_at: userRole.expires_at || '',
      is_active: userRole.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (userRole: UserRole) => {
    deleteUserRoleMutation.mutate(userRole.id);
  };

  const handleSubmit = () => {
    // Prepare the data with proper timestamp handling
    const submitData = {
      user_id: formData.user_id,
      role_id: formData.role_id,
      assigned_by: formData.assigned_by || null,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active,
    };

    if (editingUserRole) {
      updateUserRoleMutation.mutate({
        id: editingUserRole.id,
        data: submitData,
      });
    } else {
      createUserRoleMutation.mutate(submitData);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Roles</h2>
        <p className="text-muted-foreground">Manage role assignments for users.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading user roles...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading user roles: {error.message}</div>
      ) : (
        <DataTable
          data={userRolesWithNames}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Assign Role"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUserRole ? 'Edit Assignment' : 'Assign Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingUserRole ? 'Update' : 'Assign'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
