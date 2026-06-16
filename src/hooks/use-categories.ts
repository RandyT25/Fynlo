'use client'

import { useState, useEffect } from 'react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import type { Category } from '@/types/database'
import { useAuthStore } from '@/store/auth.store'

const CACHE_TTL_MS = 5 * 60 * 1000
let _cache: Category[] | null = null
let _cacheTime = 0
let _pending: Promise<Category[]> | null = null

function loadCategories(): Promise<Category[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) return Promise.resolve(_cache)
  if (_pending) return _pending
  const supabase = createClient()
  const promise = supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('order_index')
    .then(({ data }: { data: Category[] | null }) => {
      _cache = data ?? []
      _cacheTime = Date.now()
      _pending = null
      return _cache
    })
  _pending = promise
  return promise
}

export function invalidateCategoriesCache() {
  _cache = null
  _cacheTime = 0
}

export function useCategories() {
  const { user, isLoading: authLoading } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) { setIsLoading(false); return }
    loadCategories().then(cats => {
      setCategories(cats)
      setIsLoading(false)
    })
  }, [authLoading, user?.id])

  return { categories, isLoading }
}
