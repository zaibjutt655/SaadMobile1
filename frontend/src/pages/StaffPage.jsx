import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { staffAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Modal, Btn, Field, Input, Select,
  Badge, EmptyState, Spinner, ConfirmDialog, fmtDate
} from '../components/shared/UI';

const EMPTY = { name:'', username:'', password:'', role:'seller' };
const ROLE_COLOR = { owner:'purple', manager:'blue', seller:'green' };

export default function StaffPage() {
  const { user, isOwner } = useAuth();
  const [staff,   setStaff]  = useState([]);
  const [loading, setLoading]= useState(true);
  const [modal,   setModal]  = useState(false);
  const [editing, setEditing]= useState(null);
  const [form,    setForm]   = useState(EMPTY);
  const [saving,  setSaving] = useState(false);
  const [deactId, setDeactId]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await staffAPI.getAll(); setStaff(r.data.data); }
    catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, username: s.username, password:'', role: s.role }); setModal(true); };
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password; // don't send blank password
      editing ? await staffAPI.update(editing._id, payload) : await staffAPI.create(payload);
      toast.success(editing ? 'Staff updated' : 'Staff member created');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    try { await staffAPI.delete(deactId); toast.success('User deactivated'); setDeactId(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle={isOwner ? 'Manage all users' : 'Manage sellers'}
        action={<Btn onClick={openAdd}>＋ Add Staff</Btn>}
      />

      {loading ? <Spinner /> : staff.length === 0 ? (
        <EmptyState icon="👤" title="No staff members yet" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name','Username','Role','Status','Created','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.map(s => (
                <tr key={s._id} className={`hover:bg-gray-50 ${!s.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">@{s.username}</td>
                  <td className="px-4 py-3"><Badge label={s.role} color={ROLE_COLOR[s.role]} /></td>
                  <td className="px-4 py-3">
                    <Badge label={s.isActive ? 'Active' : 'Inactive'} color={s.isActive ? 'green' : 'red'} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {/* Only owner can edit; managers can only see sellers */}
                      {(isOwner || (user?.role === 'manager' && s.role === 'seller')) && (
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}>✏️</Btn>
                      )}
                      {isOwner && s._id !== user._id && s.isActive && (
                        <Btn size="sm" variant="ghost" onClick={() => setDeactId(s._id)}>🚫</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Staff Member' : 'Add Staff Member'}>
        <form onSubmit={handleSave}>
          <Field label="Full Name" required>
            <Input value={form.name} onChange={f('name')} required placeholder="Full name" />
          </Field>
          <Field label="Username" required>
            <Input value={form.username} onChange={f('username')} required placeholder="username" disabled={!!editing && !isOwner} />
          </Field>
          <Field label={editing ? 'New Password (leave blank to keep)' : 'Password'} required={!editing}>
            <Input type="password" value={form.password} onChange={f('password')} required={!editing} placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'} minLength={form.password ? 6 : undefined} />
          </Field>
          {isOwner && (
            <Field label="Role" required>
              <Select value={form.role} onChange={f('role')}>
                <option value="seller">Seller</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </Select>
            </Field>
          )}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 mb-4">
            <strong>Role permissions:</strong><br/>
            <span className="text-green-700">Owner:</span> Full control | <span className="text-blue-700">Manager:</span> Inventory + reports | <span className="text-yellow-700">Seller:</span> Add sales & purchases only
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Account'}</Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deactId} onClose={() => setDeactId(null)} onConfirm={handleDeactivate}
        title="Deactivate User" danger
        message="This user will not be able to log in. You can reactivate them by editing their account."
      />
    </div>
  );
}
