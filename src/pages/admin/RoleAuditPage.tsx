import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase';

type AuditLog = Database['public']['Tables']['role_audit_log']['Row'];

type AuditLogWithNames = AuditLog & {
  userName: string;
  changedByName: string;
};

export default function RoleAuditPage() {
  // Fetch role audit log with complete data
  const { data: auditLogs = [], isLoading, error } = useQuery({
    queryKey: ['role-audit-log'],
    queryFn: async () => {
      console.log('Fetching role audit log with admin client...');
      const { data, error } = await supabaseAdmin
        .from('role_audit_log')
        .select('*')
        .order('changed_at', { ascending: false });
      
      console.log('Role audit log query result:', { data, error });
      
      if (error) {
        console.error('Role audit log query error:', error);
        throw error;
      }
      
      console.log('Role audit log data length:', data?.length || 0);
      return data || [];
    },
  });

  // Fetch users for name mapping
  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log('Fetching users for audit log...');
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create user lookup map
  const userMap = users.reduce((acc: Record<string, string>, user: any) => {
    acc[user.id] = user.full_name;
    return acc;
  }, {});

  // Combine audit logs with user names
  const auditLogsWithNames = auditLogs.map(log => ({
    ...log,
    userName: userMap[log.user_id] || 'Unknown User',
    changedByName: log.changed_by ? (userMap[log.changed_by] || 'Unknown User') : 'System',
  }));

  const getUserName = (log: any) => log.userName || 'Unknown';
  const getChangedBy = (log: any) => log.changedByName || 'System';

  const columns: Column<AuditLogWithNames>[] = [
    {
      key: 'user_id',
      header: 'User',
      render: (log) => (
        <div className="space-y-1">
          <div className="font-medium">{log.userName}</div>
          <div className="text-xs text-muted-foreground">ID: {log.user_id}</div>
        </div>
      ),
    },
    {
      key: 'old_role',
      header: 'Role Change',
      render: (log) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{log.old_role || 'none'}</Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge>{log.new_role}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Change ID: {log.id}
          </div>
        </div>
      ),
    },
    {
      key: 'changed_by',
      header: 'Changed By',
      render: (log) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{log.changedByName}</div>
          {log.changed_by && (
            <div className="text-xs text-muted-foreground">ID: {log.changed_by}</div>
          )}
        </div>
      ),
    },
    {
      key: 'changed_at',
      header: 'Timestamp',
      render: (log) => (
        <div className="space-y-1">
          <div className="text-sm">
            {new Date(log.changed_at).toLocaleDateString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(log.changed_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (log) => (
        <div className="space-y-1">
          <div className="text-sm max-w-xs">
            {log.reason || 'No reason provided'}
          </div>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'Technical Details',
      render: (log) => (
        <div className="space-y-1">
          {log.ip_address && (
            <div className="text-xs text-muted-foreground">
              IP: {log.ip_address}
            </div>
          )}
          {log.user_agent && (
            <div className="text-xs text-muted-foreground max-w-xs truncate">
              {log.user_agent}
            </div>
          )}
          {!log.ip_address && !log.user_agent && (
            <div className="text-xs text-muted-foreground">
              No technical details
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Role Audit Log</h2>
        <p className="text-muted-foreground">View complete role change history and audit trail with all details.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading audit log...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading audit log: {error.message}</div>
      ) : (
        <DataTable data={auditLogsWithNames} columns={columns} />
      )}
    </div>
  );
}
