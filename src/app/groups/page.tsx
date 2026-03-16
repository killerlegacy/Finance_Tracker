'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Hash, ArrowRight, Loader2, Wallet } from 'lucide-react';
import { getSession } from '../lib/auth';
import { getMyGroups, Group } from '../lib/groups';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) { router.replace('/auth'); return; }
      setUserId(session.user.id);
      const data = await getMyGroups(session.user.id);
      setGroups(data);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-card flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">FinanceFlow</h1>
            <p className="text-xs text-slate-500">Group Contributions</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          ← Dashboard
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Groups</h2>
          <p className="text-slate-500 text-sm mt-1">Track shared expenses and split costs with your group.</p>
        </div>

        {/* Existing groups */}
        {groups.length > 0 && (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => router.push(`/groups/${group.id}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-card rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                    )}
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">Code: {group.invite_code}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {/* Create / Join options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/groups/new')}
            className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Plus className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Create New Group</p>
              <p className="text-xs text-slate-500 mt-1">Start a group and invite others</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/groups/join')}
            className="bg-white border-2 border-dashed border-purple-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Hash className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Join Existing Group</p>
              <p className="text-xs text-slate-500 mt-1">Enter an invite code to join</p>
            </div>
          </button>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No groups yet. Create one or join with an invite code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
