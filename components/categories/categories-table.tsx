'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Category } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface CategoriesTableProps {
  categories: Category[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleAllCategories = () => {
    setSelectedCategories(prev =>
      prev.length === categories.length ? [] : categories.map(c => c.id)
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">
              <input
                type="checkbox"
                checked={selectedCategories.length === categories.length && categories.length > 0}
                onChange={toggleAllCategories}
                className="rounded border-gray-300"
              />
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Items</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Updated</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategorySelection(category.id)}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{category.name}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600 max-w-xs truncate">
                  {category.description || 'No description'}
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {category.itemCount} items
                </Badge>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600">
                  {formatDate(category.createdAt)}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600">
                  {formatDate(category.updatedAt)}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
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

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No categories found</div>
          <div className="text-sm text-gray-400 mt-1">
            Try adjusting your search criteria
          </div>
        </div>
      )}

      {selectedCategories.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              {selectedCategories.length} categories selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}