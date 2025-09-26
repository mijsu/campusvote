import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  isAdmin?: boolean;
  onAnnouncementCreated?: (a: Announcement) => void;
  onAnnouncementDeleted?: (id: string) => void;
}
const AnnouncementList: React.FC<AnnouncementListProps> = ({ announcements, isAdmin, onAnnouncementCreated, onAnnouncementDeleted }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleOpenCreate = () => {
    setForm({ title: '', content: '' });
    setError('');
    setShowCreateModal(true);
  };
  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const payload: any = { title: form.title, content: form.content };

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Read response as text for better diagnostics
        const text = await res.text();
        console.log('Announcement create response text:', text);
        try {
          const a = JSON.parse(text);
          onAnnouncementCreated?.(a);
        } catch (parseErr) {
          console.warn('Announcement created but response parse failed', parseErr);
          // Try to reload announcements from server and notify parent with the newest one
          try {
            const listRes = await fetch('/api/announcements', { credentials: 'include' });
            if (listRes.ok) {
              const list = await listRes.json();
              if (Array.isArray(list) && list.length > 0) {
                onAnnouncementCreated?.(list[0]);
              }
            }
          } catch (e) {
            console.error('Failed to refresh announcements after create:', e);
          }
        }
        setShowCreateModal(false);
      } else {
        try {
          const data = await res.json();
          setError(data.error || `Failed to create announcement (${res.status})`);
        } catch (parseErr) {
          setError(`Failed to create announcement (${res.status} ${res.statusText})`);
        }
      }
    } catch (err) {
      setError('Network error: could not reach server (check console for details)');
      console.error('Announcement create network error', err);
    }
    setCreating(false);
  };
  const handleDelete = async () => {
    if (!announcementToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${announcementToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        onAnnouncementDeleted?.(announcementToDelete.id);
        setShowDeleteModal(false);
      }
    } catch {}
    setDeleting(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Announcements</CardTitle>
        {isAdmin && <Button size="sm" onClick={handleOpenCreate}>Create Announcement</Button>}
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-muted-foreground">No announcements at this time.</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((a: Announcement) => (
              <li key={a.id} className="border-b pb-2 last:border-b-0">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-sm text-muted-foreground mb-1">By {a.author} on {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                  {isAdmin && (
                    <button className="text-red-500 text-xs" onClick={() => { setAnnouncementToDelete(a); setShowDeleteModal(true); }}>Delete</button>
                  )}
                </div>
                <div>{a.content}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Create Announcement Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Write your announcement here..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Publish'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete announcement "{announcementToDelete?.title}"? This action cannot be undone.
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

export default AnnouncementList;
