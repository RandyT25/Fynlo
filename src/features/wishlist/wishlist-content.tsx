'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ShoppingCart, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import type { WishlistItem } from '@/types/database'

export function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', description: '', target_amount: '', current_amount: '0', url: '' })
  const supabase = createClient()
  const currencySymbol = useCurrencySymbol()

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('wishlist').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    setItems(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const addItem = async () => {
    if (!newItem.name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('wishlist').insert({
      user_id: user.id,
      name: newItem.name,
      description: newItem.description || null,
      target_amount: parseFloat(newItem.target_amount) || 0,
      current_amount: parseFloat(newItem.current_amount) || 0,
      url: newItem.url || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Item added to wishlist')
    setShowForm(false)
    setNewItem({ name: '', description: '', target_amount: '', current_amount: '0', url: '' })
    fetchItems()
  }

  const convertToGoal = async (item: WishlistItem) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: goal, error } = await supabase.from('goals').insert({
      user_id: user.id, name: item.name, description: item.description,
      type: 'savings', target_amount: item.target_amount, current_amount: item.current_amount,
    }).select().single()
    if (error) { toast.error(error.message); return }
    await supabase.from('wishlist').update({ converted_to_goal_id: goal.id }).eq('id', item.id)
    toast.success('Converted to goal!')
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    await supabase.from('wishlist').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Item removed')
    fetchItems()
  }

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
            <SheetHeader><SheetTitle>Add to Wishlist</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2"><Label>Item Name</Label><Input placeholder="e.g., MacBook Pro" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Target Price</Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input type="number" className="pl-7" value={newItem.target_amount} onChange={e => setNewItem(p => ({ ...p, target_amount: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2"><Label>Saved So Far</Label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input type="number" className="pl-7" value={newItem.current_amount} onChange={e => setNewItem(p => ({ ...p, current_amount: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="space-y-2"><Label>URL (optional)</Label><Input placeholder="https://..." value={newItem.url} onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button onClick={addItem} className="flex-1 gradient-primary border-0">Add</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your wishlist is empty" description="Add things you want to save for and track your progress" action={{ label: 'Add Item', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const progress = item.target_amount > 0 ? Math.min((item.current_amount / item.target_amount) * 100, 100) : 0
            const isConverted = !!item.converted_to_goal_id
            return (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Card className="card-hover">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">🛍️</div>
                      <div className="flex gap-1">
                        {!isConverted && (
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-purple-500" onClick={() => convertToGoal(item)} title="Convert to goal">
                            <Target className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive" onClick={() => deleteItem(item.id)}>✕</Button>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary font-bold">{formatCurrency(item.current_amount)}</span>
                        <span className="text-muted-foreground">/ {formatCurrency(item.target_amount)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{formatPercent(progress, 0)} saved</p>
                    </div>
                    {isConverted && <p className="text-xs text-green-500 font-medium">✓ Converted to goal</p>}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
