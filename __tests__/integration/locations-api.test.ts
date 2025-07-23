import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST, PUT, DELETE } from '@/app/api/locations/route'
import { locationService, inventoryService } from '@/lib/database'
import { auditedLocationService } from '@/lib/database-with-audit'

// Mock the database services
vi.mock('@/lib/database', () => ({
  locationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  inventoryService: {
    getByLocation: vi.fn()
  }
}))

vi.mock('@/lib/database-with-audit', () => ({
  auditedLocationService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

describe('/api/locations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/locations', () => {
    it('should return all locations successfully', async () => {
      const mockLocations = [
        {
          id: '1',
          name: 'Warehouse A',
          address: '123 Main Street, City, State 12345',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Warehouse B',
          address: '456 Oak Avenue, City, State 67890',
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(locationService.getAll).mockResolvedValue(mockLocations)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/locations'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(locationService.getAll).toHaveBeenCalledOnce()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLocations)
    })

    it('should search locations by name', async () => {
      const mockLocations = [
        {
          id: '1',
          name: 'Main Warehouse',
          address: '123 Main Street',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Storage Facility',
          address: '456 Oak Avenue',
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(locationService.getAll).mockResolvedValue(mockLocations)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/locations?search=warehouse'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Main Warehouse')
    })

    it('should search locations by address', async () => {
      const mockLocations = [
        {
          id: '1',
          name: 'Warehouse A',
          address: '123 Main Street',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Warehouse B',
          address: '456 Oak Avenue',
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(locationService.getAll).mockResolvedValue(mockLocations)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/locations?search=main'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].address).toBe('123 Main Street')
    })

    it('should handle locations without addresses', async () => {
      const mockLocations = [
        {
          id: '1',
          name: 'Virtual Location',
          address: null,
          created_at: new Date().toISOString()
        }
      ]

      vi.mocked(locationService.getAll).mockResolvedValue(mockLocations)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/locations?search=virtual'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Virtual Location')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(locationService.getAll).mockRejectedValue(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/locations'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch locations')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('POST /api/locations', () => {
    it('should create a new location successfully', async () => {
      const newLocation = {
        name: 'New Warehouse',
        address: '789 Pine Street, City, State 11111'
      }

      const createdLocation = {
        id: '123',
        ...newLocation,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedLocationService.create).mockResolvedValue(createdLocation)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/locations',
        body: newLocation
      })

      const response = await POST(req)
      const data = await response.json()

      expect(auditedLocationService.create).toHaveBeenCalledWith({
        name: 'New Warehouse',
        address: '789 Pine Street, City, State 11111'
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdLocation)
    })

    it('should create location with minimal required fields', async () => {
      const newLocation = {
        name: 'Minimal Location'
      }

      const createdLocation = {
        id: '123',
        name: 'Minimal Location',
        address: null,
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedLocationService.create).mockResolvedValue(createdLocation)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/locations',
        body: newLocation
      })

      const response = await POST(req)
      const data = await response.json()

      expect(auditedLocationService.create).toHaveBeenCalledWith({
        name: 'Minimal Location',
        address: null
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdLocation)
    })

    it('should validate required fields', async () => {
      const incompleteLocation = {
        address: '123 Main Street'
        // Missing name
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/locations',
        body: incompleteLocation
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
      expect(data.message).toContain('name')
    })

    it('should validate name length', async () => {
      const invalidLocation = {
        name: 'A' // Too short
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/locations',
        body: invalidLocation
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Location name must be between 2 and 100 characters')
    })

    it('should validate name maximum length', async () => {
      const invalidLocation = {
        name: 'A'.repeat(101) // Too long
      }

      const { req } = createMocks({
        method: 'POST',
        url: '/api/locations',
        body: invalidLocation
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Location name must be between 2 and 100 characters')
    })

    it('should handle creation errors', async () => {
      const newLocation = {
        name: 'Test Location'
      }

      vi.mocked(auditedLocationService.create).mockRejectedValue(new Error('Location name already exists'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/locations',
        body: newLocation
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create location')
      expect(data.message).toBe('Location name already exists')
    })
  })

  describe('PUT /api/locations', () => {
    it('should update a location successfully', async () => {
      const updates = {
        id: '123',
        name: 'Updated Warehouse',
        address: '999 Updated Street, New City, State 99999'
      }

      const updatedLocation = {
        id: '123',
        name: 'Updated Warehouse',
        address: '999 Updated Street, New City, State 99999',
        created_at: new Date().toISOString()
      }

      vi.mocked(auditedLocationService.update).mockResolvedValue(updatedLocation)

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/locations',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(auditedLocationService.update).toHaveBeenCalledWith('123', {
        name: 'Updated Warehouse',
        address: '999 Updated Street, New City, State 99999'
      })
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedLocation)
    })

    it('should require location ID', async () => {
      const updates = {
        name: 'Updated Location'
        // Missing ID
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/locations',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Location ID is required')
    })

    it('should validate name length in updates', async () => {
      const updates = {
        id: '123',
        name: 'A' // Too short
      }

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/locations',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Location name must be between 2 and 100 characters')
    })

    it('should handle update errors', async () => {
      const updates = {
        id: '123',
        name: 'Updated Location'
      }

      vi.mocked(auditedLocationService.update).mockRejectedValue(new Error('Location not found'))

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/locations',
        body: updates
      })

      const response = await PUT(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update location')
      expect(data.message).toBe('Location not found')
    })
  })

  describe('DELETE /api/locations', () => {
    it('should delete a location successfully when not in use', async () => {
      vi.mocked(inventoryService.getByLocation).mockResolvedValue([])
      vi.mocked(auditedLocationService.delete).mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/locations?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(inventoryService.getByLocation).toHaveBeenCalledWith('123')
      expect(auditedLocationService.delete).toHaveBeenCalledWith('123')
      expect(data.success).toBe(true)
      expect(data.message).toBe('Location deleted successfully')
    })

    it('should prevent deletion when location is in use', async () => {
      const mockInventoryItems = [
        { id: '1', name: 'Item 1', location_id: '123' },
        { id: '2', name: 'Item 2', location_id: '123' },
        { id: '3', name: 'Item 3', location_id: '123' }
      ]

      vi.mocked(inventoryService.getByLocation).mockResolvedValue(mockInventoryItems)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/locations?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(inventoryService.getByLocation).toHaveBeenCalledWith('123')
      expect(auditedLocationService.delete).not.toHaveBeenCalled()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Cannot delete location that is in use by inventory items')
      expect(data.message).toBe('Location is used by 3 inventory item(s)')
    })

    it('should require location ID', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/locations'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Location ID is required')
    })

    it('should handle deletion errors', async () => {
      vi.mocked(inventoryService.getByLocation).mockResolvedValue([])
      vi.mocked(auditedLocationService.delete).mockRejectedValue(new Error('Location not found'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/locations?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete location')
      expect(data.message).toBe('Location not found')
    })

    it('should handle inventory check errors', async () => {
      vi.mocked(inventoryService.getByLocation).mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/locations?id=123'
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete location')
      expect(data.message).toBe('Database error')
    })
  })
})