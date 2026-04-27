export type PantryUnit = 'g' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'count' | 'oz'

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: PantryUnit
  expiryDate: string
  category: string
  addedDate: string
  notes?: string
}

export type PantryCategory = 'Grains' | 'Proteins' | 'Vegetables' | 'Fruits' | 'Dairy' | 'Condiments' | 'Spices' | 'Other'

const PANTRY_STORAGE_KEY = 'campus-bites-pantry-items'

export const readPantryItems = (): PantryItem[] => {
  try {
    const raw = localStorage.getItem(PANTRY_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PantryItem[]
  } catch {
    return []
  }
}

export const writePantryItems = (items: PantryItem[]) => {
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('campus-bites-pantry-updated'))
}

export const addPantryItem = (item: Omit<PantryItem, 'id' | 'addedDate'>): PantryItem => {
  const newItem: PantryItem = {
    ...item,
    id: `pantry-${Date.now()}`,
    addedDate: new Date().toISOString(),
  }
  const items = readPantryItems()
  items.push(newItem)
  writePantryItems(items)
  return newItem
}

export const updatePantryItem = (id: string, updates: Partial<PantryItem>) => {
  const items = readPantryItems()
  const itemIndex = items.findIndex((item) => item.id === id)
  if (itemIndex !== -1) {
    items[itemIndex] = { ...items[itemIndex], ...updates }
    writePantryItems(items)
  }
}

export const deletePantryItem = (id: string) => {
  const items = readPantryItems()
  const filtered = items.filter((item) => item.id !== id)
  writePantryItems(filtered)
}

export const getExpiryStatus = (expiryDate: string): 'expired' | 'expiring' | 'good' => {
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 3) return 'expiring'
  return 'good'
}

export const getExpiryLabel = (expiryDate: string): string => {
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} day(s) ago`
  if (daysUntilExpiry === 0) return 'Expires today'
  if (daysUntilExpiry === 1) return 'Expires tomorrow'
  return `Expires in ${daysUntilExpiry} day(s)`
}

export const getItemsExpiringByDate = (items: PantryItem[], withinDays = 7): PantryItem[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + withinDays)

  return items.filter((item) => {
    const expiry = new Date(item.expiryDate)
    return expiry <= cutoff && getExpiryStatus(item.expiryDate) !== 'good'
  })
}

export const getPantryCategories = (): PantryCategory[] => [
  'Grains',
  'Proteins',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Condiments',
  'Spices',
  'Other',
]

export const getPantryItemsForRecipe = (pantryItems: PantryItem[]): string[] => {
  return pantryItems
    .filter((item) => getExpiryStatus(item.expiryDate) !== 'expired')
    .map((item) => item.name.toLowerCase())
}
