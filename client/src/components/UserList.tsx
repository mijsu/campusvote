import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface User {
  studentId: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

interface UserListProps {
  users: User[];
  onUserCreated?: (user: User) => void;
  onUserDeleted?: (studentId: string) => void;
}


const UserList: React.FC<UserListProps> = ({ users, onUserCreated, onUserDeleted }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [form, setForm] = useState({ studentId: '', name: '', email: '', password: '', role: 'student' });
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleOpenCreate = () => {
    setForm({ studentId: '', name: '', email: '', password: '', role: 'student' });
    setError('');
    setShowCreateModal(true);
  };
  const handleCreate = async () => {
    setCreating(true);
    setError('');
    setSuccessMsg('');
    setFieldErrors({});
    // Client-side validation
    const errs: any = {};
    if (!form.studentId) errs.studentId = 'Student ID is required';
    if (!form.name) errs.name = 'Name is required';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); setCreating(false); return; }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const user = await res.json();
        onUserCreated?.(user);
        setShowCreateModal(false);
        setSuccessMsg('User created successfully');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create user');
      }
    } catch {
      setError('Network error');
    }
    setCreating(false);
  };
  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        onUserDeleted?.(userToDelete.studentId);
        setShowDeleteModal(false);
      }
    } catch {}
    setDeleting(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Users</CardTitle>
        <Button onClick={handleOpenCreate} size="sm">Create User</Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground">No users found.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-semibold">ID</th>
                <th className="text-left font-semibold">Name</th>
                <th className="text-left font-semibold">Email</th>
                <th className="text-left font-semibold">Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.studentId} className="border-b last:border-b-0">
                  <td>{u.studentId}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <Button variant="destructive" size="sm" onClick={() => { setUserToDelete(u); setShowDeleteModal(true); }}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Input placeholder="Student ID" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} />
              {fieldErrors.studentId && <div className="text-sm text-red-500 mt-1">{fieldErrors.studentId}</div>}
            </div>

            <div>
              <Input placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {fieldErrors.name && <div className="text-sm text-red-500 mt-1">{fieldErrors.name}</div>}
            </div>

            <div>
              <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {fieldErrors.email && <div className="text-sm text-red-500 mt-1">{fieldErrors.email}</div>}
            </div>

            <div>
              <Input placeholder="Password (min 6 chars)" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {fieldErrors.password && <div className="text-sm text-red-500 mt-1">{fieldErrors.password}</div>}
            </div>

            <div>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {successMsg && <div className="text-green-600 text-sm">{successMsg}</div>}

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create User'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{userToDelete?.name}" ({userToDelete?.studentId})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserList;
