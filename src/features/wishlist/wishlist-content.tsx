'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ShoppingCart, Target, Pencil, ExternalLink, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { useCurrency } from '@/hooks/use-currency'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import type { WishlistItem } from '@/types/database'

const EMPTY_FORM = { name: '', description: '', target_amount: '', url: '' }

export function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | null>(null)
  const [newItem, setNewItem] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const supabase = createClient()
  const currencySymbol = useCurrencySymbol()
  const currency = useCurrency()

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
      current_amount: 0,
      url: newItem.url || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Added to wishlist')
    setShowForm(false)
    setNewItem(EMPTY_FORM)
    fetchItems()
  }

  const updateItem = async () => {
    if (!editItem || !editForm.name.trim()) return
    const { error } = await supabase.from('wishlist').update({
      name: editForm.name,
      description: editForm.description || null,
      target_amount: parseFloat(editForm.target_amount) || 0,
      url: editForm.url || null,
    }).eq('id', editItem.id)
    if (error) { toast.error(error.message); return }
    toast.success('Item updated')
    setEditItem(null)
    fetchItems()
  }

  const convertToGoal = async (item: WishlistItem) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: goal, error } = await supabase.from('goals').insert({
      user_id: user.id,
      name: item.name,
      description: item.description,
      type: 'savings',
      target_amount: item.target_amount,
      current_amount: 0,
      color: '#3B82F6',
      priority: 0,
      currency,
    }).select().single()
    if (error) { toast.error(error.message); return }
    await supabase.from('wishlist').update({ converted_to_goal_id: goal.id }).eq('id', item.id)
    toast.success('Moved to Goals — start saving!')
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    await supabase.from('wishlist').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Item removed')
    fetchItems()
  }

  const openEdit = (item: WishlistItem) => {
    setEditForm({
      name: item.name,
      description: item.description ?? '',
      target_amount: item.target_amount ? String(item.target_amount) : '',
      url: item.url ?? '',
    })
    setEditItem(item)
  }

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4 space-y-3">
      <div className="flex justify-end">
        <Button className="gradient-primary border-0 gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your wishlist is empty"
          description="Add things you'd love to buy someday. When you're ready to save for one, turn it into a Goal."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const isConverted = !!item.converted_to_goal_id
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={isConverted ? 'opacity-60' : ''}
              >
                <div className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      🛍️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      {item.target_amount > 0 && (
                        <p className="text-base font-bold text-primary mt-1">
                          {formatCurrency(item.target_amount, currency)}
                        </p>
                      )}
                      {isConverted && (
                        <p className="text-xs text-green-500 font-medium mt-1">✓ Saved as Goal</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Action row */}
                  {!isConverted && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-medium text-muted-foreground active:bg-muted/70"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View item
                        </a>
                      )}
                      <button
                        onClick={() => convertToGoal(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-400 text-xs font-semibold active:bg-purple-500/25 transition-colors ml-auto"
                      >
                        <Target className="w-3.5 h-3.5" />
                        Save for this
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Add to Wishlist</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 space-y-4">
            <div className="space-y-2">
              <Label>What do you want?</Label>
              <Input placeholder="e.g., iPhone 16 Pro, Sony headphones…" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Price (optional)</Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 transition-all">
                <span className="flex items-center px-3 text-sm font-semibold text-muted-foreground bg-muted/50 border-r border-input shrink-0 select-none min-w-[2.5rem] justify-center">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0"
                  value={newItem.target_amount}
                  onChange={e => setNewItem(p => ({ ...p, target_amount: e.target.value }))}
                  className="flex-1 px-3 py-3 text-base font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input placeholder="https://…" value={newItem.url} onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="Color, size, why you want it…" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
              <Button onClick={addItem} className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold">Add to Wishlist</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Edit Item</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 space-y-4">
            <div className="space-y-2">
              <Label>What do you want?</Label>
              <Input placeholder="e.g., iPhone 16 Pro" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Price (optional)</Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 transition-all">
                <span className="flex items-center px-3 text-sm font-semibold text-muted-foreground bg-muted/50 border-r border-input shrink-0 select-none min-w-[2.5rem] justify-center">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0"
                  value={editForm.target_amount}
                  onChange={e => setEditForm(p => ({ ...p, target_amount: e.target.value }))}
                  className="flex-1 px-3 py-3 text-base font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input placeholder="https://…" value={editForm.url} onChange={e => setEditForm(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
              <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
              <Button onClick={updateItem} className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold">Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
