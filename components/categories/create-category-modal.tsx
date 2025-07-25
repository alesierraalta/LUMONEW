'use client'

import { useState, useCallback } from 'react'
import { Package, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { categoryService } from '@/lib/database'
import { useTranslations } from 'next-intl'

interface CreateCategoryModalProps {
  onSuccess?: () => void
}

export function CreateCategoryModal({ onSuccess }: CreateCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { closeModal } = useModal()
  const { addToast } = useToast()
  const t = useTranslations('categories')
  const tCommon = useTranslations('common')

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired')
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('nameMinLength')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData.name, t])

  const handleInputChange = useCallback((field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await categoryService.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      })
      
      addToast({
        type: 'success',
        title: t('categoryCreated'),
        description: t('categoryCreatedDescription', { name: formData.name })
      })
      
      onSuccess?.()
      closeModal()
    } catch (error) {
      console.error('Error creating category:', error)
      addToast({
        type: 'error',
        title: t('createError'),
        description: t('createErrorDescription')
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateForm, addToast, t, onSuccess, closeModal])

  const handleCancel = useCallback(() => {
    closeModal()
  }, [closeModal])

  const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarillo' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#06B6D4', label: 'Cian' },
    { value: '#84CC16', label: 'Lima' },
    { value: '#F97316', label: 'Naranja' }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('createCategory')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('createCategoryDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('categoryName')} *
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder={t('categoryNamePlaceholder')}
            disabled={isLoading}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('description')}
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder={t('descriptionPlaceholder')}
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('categoryColor')}
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                disabled={isLoading}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  formData.color === color.value 
                    ? 'border-gray-800 dark:border-gray-200 ring-2 ring-gray-300 dark:ring-gray-600' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: formData.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('selectedColor')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('creating') : t('createCategory')}
          </Button>
        </div>
      </form>
    </div>
  )
}