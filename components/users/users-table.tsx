'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, Mail, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { userService } from '@/lib/database'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

interface UsersTableProps {
  searchTerm?: string
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-blue-100 text-blue-800'
    case 'employee':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Shield className="w-3 h-3" />
    case 'manager':
      return <User className="w-3 h-3" />
    case 'employee':
      return <User className="w-3 h-3" />
    default:
      return <User className="w-3 h-3" />
  }
}

export function UsersTable({ searchTerm = '' }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users data
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const data = await userService.getAll()
        setUsers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleAllUsers = () => {
    setSelectedUsers(prev =>
      prev.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id)
    )
  }

  const handleEdit = (user: User) => {
    // TODO: Implement edit functionality
    console.log('Edit user:', user)
  }

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete the user "${user.name}"?`)) {
      try {
        await userService.delete(user.id)
        setUsers(prev => prev.filter(u => u.id !== user.id))
      } catch (err) {
        console.error('Failed to delete user:', err)
        alert('Failed to delete user.')
      }
    }
  }

  const handleBulkDeactivate = async () => {
    if (confirm(`Are you sure you want to deactivate ${selectedUsers.length} users?`)) {
      try {
        await Promise.all(selectedUsers.map(id => 
          userService.update(id, { is_active: false })
        ))
        setUsers(prev => prev.map(u => 
          selectedUsers.includes(u.id) ? { ...u, is_active: false } : u
        ))
        setSelectedUsers([])
      } catch (err) {
        console.error('Failed to deactivate users:', err)
        alert('Failed to deactivate some users.')
      }
    }
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-4 px-4">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
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
        <div className="text-red-600">Error loading users: {error}</div>
      </div>
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
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={toggleAllUsers}
                className="rounded border-gray-300"
              />
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{user.email}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant="secondary" className={`${getRoleColor(user.role)} flex items-center space-x-1 w-fit`}>
                  {getRoleIcon(user.role)}
                  <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </Badge>
              </td>
              <td className="py-4 px-4">
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600">
                  {user.last_login ? (
                    <div>
                      <div>{formatDate(new Date(user.last_login))}</div>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(new Date(user.last_login)).split(' ')[1]}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600">
                  {formatDate(new Date(user.created_at))}
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
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(user)}
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

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">No users found</div>
          <div className="text-sm text-gray-400 mt-1">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first user to get started'}
          </div>
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              {selectedUsers.length} users selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button variant="outline" size="sm">
                Bulk Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={handleBulkDeactivate}
              >
                Deactivate Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}