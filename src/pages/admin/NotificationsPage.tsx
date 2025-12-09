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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    message: '',
    type: 'info',
    read: false,
    post_id: null,
    from_user_id: null,
    updated_at: new Date().toISOString(),
  });

  // Fetch notifications with user data
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!notifications_user_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => fetchTableData('profiles', 'id, full_name'),
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => deleteRecord('notifications', notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting notification: ${error.message}`);
    },
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: (notificationData: Omit<Notification, 'id' | 'created_at'>) => 
      insertRecord('notifications', notificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification sent successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error sending notification: ${error.message}`);
    },
  });

  const getUserName = (n: any) => (n as any).profiles?.full_name || 'Unknown';

  const columns: Column<Notification>[] = [
    { key: 'title', header: 'Title' },
    {
      key: 'user_id',
      header: 'Recipient',
      render: (n) => getUserName(n),
    },
    {
      key: 'type',
      header: 'Type',
      render: (n) => <Badge variant="secondary">{n.type}</Badge>,
    },
    {
      key: 'read',
      header: 'Status',
      render: (n) => (
        <Badge variant={n.read ? 'outline' : 'default'}>
          {n.read ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    { key: 'created_at', header: 'Date' },
  ];

  const handleAdd = () => {
    setFormData({ user_id: '', type: 'info', title: '', message: '', read: false, post_id: null, from_user_id: null, updated_at: new Date().toISOString() });
    setIsDialogOpen(true);
  };

  const handleDelete = (notification: Notification) => {
    deleteNotificationMutation.mutate(notification.id);
  };

  const handleSubmit = () => {
    createNotificationMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
        <p className="text-muted-foreground">Send and manage user notifications.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading notifications...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading notifications: {error.message}</div>
      ) : (
        <DataTable
          data={notifications}
          columns={columns}
          searchKey="title"
          onAdd={handleAdd}
          onDelete={handleDelete}
          addLabel="Send Notification"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
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
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
