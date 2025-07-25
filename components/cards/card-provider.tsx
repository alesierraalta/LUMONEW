'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import {
  InfoCard,
  StatCard,
  CardContext as CardContextType,
  PageCardConfig,
  User
} from '@/lib/types'

interface CardProviderProps {
  children: ReactNode
  pageConfig?: PageCardConfig
  currentPage: string
  currentUser: User
}

const CardContext = createContext<CardContextType | undefined>(undefined)

export function CardProvider({ children, pageConfig, currentPage, currentUser }: CardProviderProps) {
  const [cards, setCards] = useState<InfoCard[]>([])

  const addCard = useCallback((card: InfoCard) => {
    setCards(prev => {
      // Check if card already exists
      const exists = prev.some(c => c.id === card.id)
      if (exists) {
        // Update existing card
        return prev.map(c => c.id === card.id ? card : c)
      }
      // Add new card
      return [...prev, card]
    })
  }, [])

  const removeCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId))
  }, [])

  const updateCard = useCallback((cardId: string, updates: Partial<InfoCard>) => {
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, ...updates } : card
    ))
  }, [])

  const getVisibleCards = () => {
    return cards.sort((a, b) => {
      // Sort by priority first (critical > high > medium > low)
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority] || 0
      const bPriority = priorityOrder[b.priority] || 0
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }

      // Then sort by creation time (newest first)
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      
      return bTime - aTime
    })
  }

  const contextValue: CardContextType = {
    currentPage,
    currentUser,
    cards,
    visibleCards: getVisibleCards(),
    dismissedCards: [],
    expandedCards: [],
    addCard,
    removeCard,
    updateCard,
    dismissCard: () => {}, // No-op for simplified version
    expandCard: () => {}, // No-op for simplified version
    collapseCard: () => {}, // No-op for simplified version
    refreshCard: () => {}, // No-op for simplified version
    filterCards: () => {}, // No-op for simplified version
    cardSettings: {
      layout: 'grid',
      columns: 3,
      gap: 'medium',
      autoRefresh: false,
      refreshInterval: 0,
      animationsEnabled: false,
      persistDismissed: false,
      persistExpanded: false,
      reducedMotion: true,
      highContrast: false
    },
    updateCardSettings: () => {} // No-op for simplified version
  }

  return (
    <CardContext.Provider value={contextValue}>
      {children}
    </CardContext.Provider>
  )
}

export function useCards() {
  const context = useContext(CardContext)
  if (context === undefined) {
    throw new Error('useCards must be used within a CardProvider')
  }
  return context
}

// Simplified hook for creating basic informational cards
export function usePageCards(pageType: string, data?: any) {
  const { addCard } = useCards()
  const generatedRef = useRef<string>('')

  useEffect(() => {
    // Create a unique key for this page/data combination
    const dataKey = `${pageType}-${JSON.stringify(data)}`
    
    // Skip if we've already generated cards for this exact combination
    if (generatedRef.current === dataKey) {
      return
    }

    // Generate simple informational cards based on page type and data
    const generateCards = () => {
      const cards: InfoCard[] = []

      switch (pageType) {
        case 'dashboard':
          if (data?.totalItems) {
            cards.push({
              id: 'total-items',
              type: 'stat',
              title: 'Total de Productos',
              subtitle: 'Productos en inventario',
              value: data.totalItems,
              priority: 'medium',
              size: 'small',
              variant: 'default',
              color: 'blue',
              pageContext: ['dashboard'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }

          if (data?.totalCategories) {
            cards.push({
              id: 'total-categories',
              type: 'stat',
              title: 'Categorías',
              subtitle: 'Categorías registradas',
              value: data.totalCategories,
              priority: 'medium',
              size: 'small',
              variant: 'default',
              color: 'green',
              pageContext: ['dashboard'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }

          if (data?.totalLocations) {
            cards.push({
              id: 'total-locations',
              type: 'stat',
              title: 'Ubicaciones',
              subtitle: 'Ubicaciones disponibles',
              value: data.totalLocations,
              priority: 'medium',
              size: 'small',
              variant: 'default',
              color: 'purple',
              pageContext: ['dashboard'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }
          break

        case 'inventory':
          if (data?.totalItems) {
            cards.push({
              id: 'inventory-total',
              type: 'stat',
              title: 'Total de Productos',
              subtitle: 'Productos en inventario',
              value: data.totalItems,
              priority: 'medium',
              size: 'small',
              variant: 'default',
              color: 'blue',
              pageContext: ['inventory'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }

          if (data?.goodStockCount !== undefined) {
            cards.push({
              id: 'good-stock',
              type: 'stat',
              title: 'Stock Normal',
              subtitle: 'Productos con stock suficiente',
              value: data.goodStockCount,
              priority: 'low',
              size: 'small',
              variant: 'default',
              color: 'green',
              pageContext: ['inventory'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }

          if (data?.lowStockCount !== undefined) {
            cards.push({
              id: 'low-stock',
              type: 'stat',
              title: 'Stock Bajo',
              subtitle: 'Productos con stock bajo',
              value: data.lowStockCount,
              priority: 'high',
              size: 'small',
              variant: 'default',
              color: 'yellow',
              pageContext: ['inventory'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }

          if (data?.outOfStockCount !== undefined) {
            cards.push({
              id: 'out-of-stock',
              type: 'stat',
              title: 'Sin Stock',
              subtitle: 'Productos agotados',
              value: data.outOfStockCount,
              priority: 'critical',
              size: 'small',
              variant: 'filled',
              color: 'red',
              pageContext: ['inventory'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }
          break

        case 'categories':
          if (data?.totalCategories) {
            cards.push({
              id: 'categories-total',
              type: 'stat',
              title: 'Total de Categorías',
              subtitle: 'Categorías registradas',
              value: data.totalCategories,
              priority: 'medium',
              size: 'small',
              variant: 'default',
              color: 'green',
              pageContext: ['categories'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }
          break

        case 'locations':
          if (data?.totalLocations) {
            cards.push({
              id: 'locations-total',
              type: 'stat',
              title: 'Total de Ubicaciones',
              subtitle: 'Ubicaciones disponibles',
              value: data.totalLocations,
              priority: 'medium',
              size: 'small',
              variant: 'default',
              color: 'purple',
              pageContext: ['locations'],
              userRoles: ['admin', 'manager', 'employee'],
              createdAt: new Date()
            } as StatCard)
          }
          break
      }

      // Add generated cards
      cards.forEach(card => {
        addCard(card)
      })
      
      // Mark this combination as generated
      generatedRef.current = dataKey
    }

    generateCards()
  }, [pageType, data, addCard])
}