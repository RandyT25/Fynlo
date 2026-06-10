'use client'

import type { LucideProps } from 'lucide-react'
import {
  Briefcase, Laptop, TrendingUp, Home, PlusCircle, Utensils, Car,
  HeartPulse, ShoppingBag, Gamepad2, GraduationCap, Sparkles, Zap,
  Shield, Repeat, Plane, Gift, MoreHorizontal, CreditCard, Wallet,
  Landmark, Building2, PiggyBank, DollarSign, Coffee, Music, Tv,
  Book, Phone, FileText, Bitcoin, Banknote, Star, Tag, CircleDot,
  ShoppingCart, Heart, Package, Wrench, Scissors,
} from 'lucide-react'
import type { FC } from 'react'

const ICON_MAP: Record<string, FC<LucideProps>> = {
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'home': Home,
  'plus-circle': PlusCircle,
  'utensils': Utensils,
  'car': Car,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  'gamepad-2': Gamepad2,
  'graduation-cap': GraduationCap,
  'sparkles': Sparkles,
  'zap': Zap,
  'shield': Shield,
  'repeat': Repeat,
  'plane': Plane,
  'gift': Gift,
  'more-horizontal': MoreHorizontal,
  'credit-card': CreditCard,
  'wallet': Wallet,
  'landmark': Landmark,
  'building-2': Building2,
  'piggy-bank': PiggyBank,
  'dollar-sign': DollarSign,
  'coffee': Coffee,
  'music': Music,
  'tv': Tv,
  'book': Book,
  'phone': Phone,
  'file-text': FileText,
  'bitcoin': Bitcoin,
  'banknote': Banknote,
  'star': Star,
  'tag': Tag,
  'shopping-cart': ShoppingCart,
  'heart': Heart,
  'package': Package,
  'wrench': Wrench,
  'scissors': Scissors,
}

interface DynamicIconProps extends LucideProps {
  name: string
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = ICON_MAP[name] ?? CircleDot
  return <Icon {...props} />
}
