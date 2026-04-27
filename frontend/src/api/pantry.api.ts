import axiosClient from './axiosClient'

export type PantryUnit = 'g' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'count' | 'oz'
export type PantryCategory = 'Grains' | 'Proteins' | 'Vegetables' | 'Fruits' | 'Dairy' | 'Condiments' | 'Spices' | 'Other'
export type PantryApprovalStatus = 'pending' | 'approved'

export interface PantryUser {
  id: string
  name: string
  email: string
}

export interface PantryItemRecord {
  id: string
  name: string
  quantity: number
  unit: PantryUnit
  purchaseDate: string
  expiryDate: string
  category: PantryCategory
  notes?: string
  lowStock?: boolean
  approvalStatus: PantryApprovalStatus
  approvedAt?: string | null
  addedDate: string
  user?: PantryUser
}

export interface CreatePantryItemInput {
  name: string
  quantity: number
  unit: PantryUnit
  purchaseDate?: string
  expiryDate: string
  category: PantryCategory
  notes?: string
}

export const pantryApi = {
  getMyItems: async () => {
    const response = await axiosClient.get('/pantry/my')
    return response.data
  },

  createItem: async (payload: CreatePantryItemInput) => {
    const response = await axiosClient.post('/pantry', payload)
    return response.data
  },

  updateItem: async (id: string, payload: Partial<CreatePantryItemInput>) => {
    const response = await axiosClient.patch(`/pantry/${id}`, payload)
    return response.data
  },

  getAdminItems: async (params: { search?: string; status?: 'all' | 'pending' | 'approved'; stock?: 'all' | 'low'; page?: number; limit?: number }) => {
    const response = await axiosClient.get('/pantry/admin/items', { params })
    return response.data
  },

  approveAdminItem: async (id: string) => {
    const response = await axiosClient.patch(`/pantry/admin/items/${id}/approve`)
    return response.data
  },

  deleteAdminItem: async (id: string) => {
    const response = await axiosClient.delete(`/pantry/admin/items/${id}`)
    return response.data
  },
}
