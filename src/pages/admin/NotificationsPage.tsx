import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Send, Users } from 'lucide-react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
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
  const [bulkFormData, setBulkFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    read: false,
    post_id: null,
    from_user_id: null,
    updated_at: new Date().toISOString(),
  });

  // Fetch notifications with user data and related information
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('Fetching notifications...');
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Notifications query result:', { data, error });
      
      if (error) {
        console.error('Notifications query error:', error);
        throw error;
      }
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

  // Bulk notification mutation
  const bulkNotificationMutation = useMutation({
    mutationFn: async (notifications: Omit<Notification, 'id' | 'created_at'>[]) => {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications as any)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`Successfully sent ${data?.length || 0} notifications`);
      setIsBulkDialogOpen(false);
      setSelectedUsers([]);
      setSendToAll(false);
    },
    onError: (error) => {
      toast.error(`Error sending bulk notifications: ${error.message}`);
    },
  });

  const getUserName = (n: any) => (n as any).profiles?.full_name || 'Unknown User';
  const getPostTitle = (n: any) => (n as any).posts?.title || 'No post';
  const getFromUserName = (n: any) => (n as any).from_user?.full_name || 'System';

  const columns: Column<Notification>[] = [
    { key: 'title', header: 'Title' },
    {
      key: 'user_id',
      header: 'Recipient',
      render: (n) => (
        <div>
          <div className="font-medium">User ID: {n.user_id?.slice(0, 8)}...</div>
          <div className="text-xs text-muted-foreground">{getUserName(n)}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (n) => <Badge variant="secondary">{n.type}</Badge>,
    },
    {
      key: 'message',
      header: 'Message',
      render: (n) => (
        <div className="max-w-md">
          <p className="text-sm truncate">{n.message || 'No message'}</p>
        </div>
      ),
    },
    {
      key: 'post_id',
      header: 'Related Post',
      render: (n) => n.post_id ? (
        <div className="text-sm">
          <div className="font-medium">{getPostTitle(n)}</div>
          <div className="text-xs text-muted-foreground">ID: {n.post_id.slice(0, 8)}...</div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">No post</span>
      ),
    },
    {
      key: 'from_user_id',
      header: 'From',
      render: (n) => n.from_user_id ? getFromUserName(n) : 'System',
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
    { 
      key: 'created_at', 
      header: 'Date',
      render: (n) => (
        <div className="text-sm">
          <div>{new Date(n.created_at).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(n.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setFormData({ user_id: '', type: 'info', title: '', message: '', read: false, post_id: null, from_user_id: null, updated_at: new Date().toISOString() });
    setIsDialogOpen(true);
  };

  const handleBulkAdd = () => {
    setBulkFormData({ type: 'info', title: '', message: '', read: false, post_id: null, from_user_id: null, updated_at: new Date().toISOString() });
    setSelectedUsers([]);
    setSendToAll(false);
    setIsBulkDialogOpen(true);
  };

  const handleDelete = (notification: Notification) => {
    deleteNotificationMutation.mutate(notification.id);
  };

  const handleSubmit = () => {
    if (!formData.user_id || !formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    createNotificationMutation.mutate(formData);
  };

  const handleBulkSubmit = () => {
    if (!bulkFormData.title || !bulkFormData.message) {
      toast.error('Please fill in title and message');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      toast.error('Please select users or choose "Send to all users"');
      return;
    }

    const recipients = sendToAll ? users.map((u: any) => u.id) : selectedUsers;
    const notifications = recipients.map(userId => ({
      ...bulkFormData,
      user_id: userId,
      created_at: new Date().toISOString(),
    }));

    bulkNotificationMutation.mutate(notifications);
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: any) => u.id));
    }
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
          extraActions={
            <Button onClick={handleBulkAdd} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Bulk Send
            </Button>
          }
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

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Bulk Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-to-all"
                    checked={sendToAll}
                    onCheckedChange={(checked) => {
                      setSendToAll(checked as boolean);
                      if (checked) setSelectedUsers([]);
                    }}
                  />
                  <Label htmlFor="send-to-all" className="text-sm font-medium">
                    Send to all users ({users.length} users)
                  </Label>
                </div>
                
                {!sendToAll && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium">
                        Select all users ({selectedUsers.length} of {users.length} selected)
                      </Label>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                      {users.map((user: any) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                          />
                          <Label htmlFor={`user-${user.id}`} className="text-sm">
                            {user.full_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={bulkFormData.type}
                onValueChange={(value) => setBulkFormData({ ...bulkFormData, type: value })}
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
                value={bulkFormData.title}
                onChange={(e) => setBulkFormData({ ...bulkFormData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={bulkFormData.message}
                onChange={(e) => setBulkFormData({ ...bulkFormData, message: e.target.value })}
                placeholder="Notification message..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {sendToAll 
                ? `Will send to all ${users.length} users`
                : `Will send to ${selectedUsers.length} user(s)`
              }
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleBulkSubmit}
                disabled={bulkNotificationMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {bulkNotificationMutation.isPending ? 'Sending...' : 'Send Bulk'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
