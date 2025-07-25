'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { categoryService } from '@/lib/database'

interface Category {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

interface CategoriesTableProps {
  searchTerm?: string
}

export function CategoriesTable({ searchTerm = '' }: CategoriesTableProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories data
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const data = await categoryService.getAll()
        setCategories(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleAllCategories = () => {
    setSelectedCategories(prev =>
      prev.length === filteredCategories.length ? [] : filteredCategories.map(c => c.id)
    )
  }

  const handleEdit = (category: Category) => {
    router.push(`/categories/edit/${category.id}`)
  }

  const handleDelete = async (category: Category) => {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        await categoryService.delete(category.id)
        setCategories(prev => prev.filter(c => c.id !== category.id))
      } catch (err) {
        console.error('Failed to delete category:', err)
        alert('Failed to delete category. It may be in use by inventory items.')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) {
      try {
        await Promise.all(selectedCategories.map(id => categoryService.delete(id)))
        setCategories(prev => prev.filter(c => !selectedCategories.includes(c.id)))
        setSelectedCategories([])
      } catch (err) {
        console.error('Failed to delete categories:', err)
        alert('Failed to delete some categories. They may be in use by inventory items.')
      }
    }
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Category</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Description</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Created</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Updated</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-4 px-4">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end space-x-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">Error loading categories: {error}</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4">
              <input
                type="checkbox"
                checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                onChange={toggleAllCategories}
                className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              />
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Category</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Description</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Updated</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((category) => (
            <tr key={category.id} className="border-b border-border hover:bg-muted/50">
              <td className="py-4 px-4">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategorySelection(category.id)}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                />
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{category.name}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {category.description || 'No description'}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(new Date(category.created_at))}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(new Date(category.updated_at))}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">No categories found</div>
          <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first category to get started'}
          </div>
        </div>
      )}

      {selectedCategories.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {selectedCategories.length} categories selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}