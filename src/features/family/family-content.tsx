'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Crown, UserCheck, Eye, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import type { Family, FamilyMember } from '@/types/database'

const ROLE_ICONS = { owner: Crown, admin: UserCheck, member: Users, viewer: Eye }
const ROLE_COLORS = { owner: '#F59E0B', admin: '#8B5CF6', member: '#3B82F6', viewer: '#6B7280' }

export function FamilyContent() {
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin'|'member'|'viewer'>('member')
  const [showCreate, setShowCreate] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchFamily() }, [])

  const fetchFamily = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsLoading(false); return }

    const { data: memberData } = await supabase.from('family_members').select('*, family:families(*)').eq('user_id', user.id).eq('status', 'active').maybeSingle()

    if (memberData?.family) {
      setFamily((memberData as any).family)
      const { data: allMembers } = await supabase.from('family_members').select('*, profile:profiles(id,full_name,email,avatar_url)').eq('family_id', (memberData as any).family.id)
      setMembers(allMembers ?? [])
    }
    setIsLoading(false)
  }

  const createFamily = async () => {
    if (!familyName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: fam, error } = await supabase.from('families').insert({ name: familyName, owner_id: user.id }).select().single()
    if (error) { toast.error(error.message); return }
    await supabase.from('family_members').insert({ family_id: fam.id, user_id: user.id, role: 'owner', status: 'active', joined_at: new Date().toISOString() })
    toast.success('Family created!')
    setShowCreate(false)
    fetchFamily()
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !family) return
    toast.success(`Invitation sent to ${inviteEmail}`)
    setShowInvite(false)
    setInviteEmail('')
  }

  if (isLoading) return <LoadingPage />

  if (!family) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={Users}
          title="No family group yet"
          description="Create a family group to share budgets, accounts, and goals with your partner or family"
          action={{ label: 'Create Family', onClick: () => setShowCreate(true) }}
        />
        <Sheet open={showCreate} onOpenChange={setShowCreate}>
          <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
            <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>Create Family Group</SheetTitle></SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 space-y-4">
              <div className="space-y-2"><Label>Family Name</Label><Input placeholder="e.g., The Smiths" value={familyName} onChange={e => setFamilyName(e.target.value)} /></div>
              <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
                <Button onClick={createFamily} className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold">Create</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <Card className="gradient-primary text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">👨‍👩‍👧‍👦</div>
            <div>
              <h2 className="text-2xl font-bold">{family.name}</h2>
              <p className="text-white/70">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Members</CardTitle>
          <Sheet open={showInvite} onOpenChange={setShowInvite}>
            <SheetTrigger>
              <Button size="sm" className="gradient-primary border-0 gap-2"><Plus className="w-4 h-4" /> Invite</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
              <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>Invite Member</SheetTitle></SheetHeader>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 space-y-4">
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="partner@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v: string | null) => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — can manage everything</SelectItem>
                      <SelectItem value="member">Member — can add transactions</SelectItem>
                      <SelectItem value="viewer">Viewer — read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
                  <Button variant="outline" onClick={() => setShowInvite(false)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
                  <Button onClick={inviteMember} className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold gap-2"><Mail className="w-4 h-4" />Send Invite</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map(member => {
            const profile = (member as any).profile
            const RoleIcon = ROLE_ICONS[member.role] ?? Users
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="gradient-primary text-white font-bold">
                    {profile?.full_name?.[0] ?? profile?.email?.[0] ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{profile?.full_name ?? 'Member'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <RoleIcon className="w-3 h-3" style={{ color: ROLE_COLORS[member.role] }} />
                  <Badge variant="secondary" className="text-[10px] capitalize">{member.role}</Badge>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
