'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input'
import { ImageUpload } from '@/components/ui/image-upload'
import { LoadingButton } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { useModal } from '@/components/ui/modal'
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Save, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export interface UserData {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  location: string
  bio: string
  profileImage?: string
  startDate: string
  status: 'active' | 'inactive' | 'pending'
}

interface UserFormProps {
  user?: UserData
  onSubmit: (userData: UserData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const initialUserData: Omit<UserData, 'id'> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  location: '',
  bio: '',
  startDate: '',
  status: 'active'
}

export function UserForm({ user, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<UserData>(user || { ...initialUserData })
  const [validationState, setValidationState] = useState<Record<string, boolean>>({})
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const { addToast } = useToast()
  const { closeModal } = useModal()
  const t = useTranslations('users.form')
  const tUsers = useTranslations('users')

  const isEditing = Boolean(user?.id)
  const isFormValid = Object.values(validationState).every(Boolean) && 
    formData.firstName && formData.lastName && formData.email

  const handleInputChange = useCallback((field: keyof UserData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleValidation = useCallback((field: string) => (isValid: boolean) => {
    setValidationState(prev => ({ ...prev, [field]: isValid }))
  }, [])

  const handleImageSelect = useCallback((file: File) => {
    setProfileImageFile(file)
    // In a real app, you might upload the image immediately or show a preview
    const imageUrl = URL.createObjectURL(file)
    setFormData(prev => ({ ...prev, profileImage: imageUrl }))
  }, [])

  const handleImageRemove = useCallback(() => {
    setProfileImageFile(null)
    setFormData(prev => ({ ...prev, profileImage: undefined }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      addToast({
        type: 'error',
        title: t('incompleteForm'),
        description: t('completeRequiredFields')
      })
      return
    }

    try {
      await onSubmit(formData)
      
      addToast({
        type: 'success',
        title: isEditing ? t('userUpdated') : t('userCreated'),
        description: t(isEditing ? 'userUpdatedSuccess' : 'userCreatedSuccess', {
          name: `${formData.firstName} ${formData.lastName}`
        })
      })
      
      closeModal()
    } catch (error) {
      addToast({
        type: 'error',
        title: t('saveError'),
        description: t('saveErrorDescription')
      })
    }
  }, [formData, isFormValid, isEditing, onSubmit, addToast, closeModal])

  const handleCancel = useCallback(() => {
    onCancel?.()
    closeModal()
  }, [onCancel, closeModal])

  // Email validation
  const emailValidation = {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return t('validEmail')
      }
      return null
    }
  }

  // Phone validation
  const phoneValidation = {
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    custom: (value: string) => {
      if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value)) {
        return t('validPhone')
      }
      return null
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? t('editUser') : t('newUser')}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing ? t('updateUserInfo') : t('completeUserData')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex justify-center">
            <div className="w-32">
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                currentImage={formData.profileImage}
                maxSize={2}
                className="w-32 h-32"
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                {t('profileImageOptional')}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              {t('personalInformation')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label={t('firstNameRequired')}
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onValidation={handleValidation('firstName')}
                validation={{ required: true, minLength: 2 }}
                disabled={isLoading}
              />
              
              <FloatingInput
                label={t('lastNameRequired')}
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onValidation={handleValidation('lastName')}
                validation={{ required: true, minLength: 2 }}
                disabled={isLoading}
              />
            </div>

            <FloatingInput
              label={t('emailRequired')}
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              onValidation={handleValidation('email')}
              validation={emailValidation}
              disabled={isLoading}
            />

            <FloatingInput
              label={t('phoneRequired')}
              type="tel"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              onValidation={handleValidation('phone')}
              validation={phoneValidation}
              disabled={isLoading}
            />
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gray-600" />
              {t('professionalInformation')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label={t('positionRequired')}
                value={formData.position}
                onChange={handleInputChange('position')}
                onValidation={handleValidation('position')}
                validation={{ required: true, minLength: 2 }}
                disabled={isLoading}
              />
              
              <FloatingInput
                label={t('departmentRequired')}
                value={formData.department}
                onChange={handleInputChange('department')}
                onValidation={handleValidation('department')}
                validation={{ required: true, minLength: 2 }}
                disabled={isLoading}
              />
            </div>

            <FloatingInput
              label={t('locationRequired')}
              value={formData.location}
              onChange={handleInputChange('location')}
              onValidation={handleValidation('location')}
              validation={{ required: true, minLength: 2 }}
              disabled={isLoading}
            />

            <FloatingInput
              label={t('startDateRequired')}
              type="date"
              value={formData.startDate}
              onChange={handleInputChange('startDate')}
              onValidation={handleValidation('startDate')}
              validation={{ required: true }}
              disabled={isLoading}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('statusRequired')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as UserData['status'] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                disabled={isLoading}
              >
                <option value="active">{tUsers('active')}</option>
                <option value="inactive">{tUsers('inactive')}</option>
                <option value="pending">{tUsers('pending')}</option>
              </select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('additionalInformation')}
            </h3>
            
            <FloatingTextarea
              label={t('biography')}
              value={formData.bio}
              onChange={handleInputChange('bio')}
              validation={{ maxLength: 500 }}
              helperText={t('maxCharacters')}
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText={isEditing ? t('updating') : t('creating')}
              disabled={!isFormValid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? t('updateUser') : t('createUser')}
            </LoadingButton>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2 inline" />
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}