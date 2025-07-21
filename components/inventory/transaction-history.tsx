'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  ShoppingCart,
  Package,
  Eye,
  Calendar,
  User,
  Hash,
  DollarSign,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  TrendingUp,
  FileText,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

// Transaction interfaces (matching the transaction builder)
interface TransactionLineItem {
  id: string
  product: {
    id: string
    sku: string
    name: string
    description: string
    price: number
    cost: number
  }
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

interface Transaction {
  id: string
  type: 'sale' | 'stock_addition'
  lineItems: TransactionLineItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  notes?: string
  createdAt: Date
  createdBy: string
  status: 'completed' | 'pending' | 'cancelled'
}

interface TransactionHistoryProps {
  isOpen: boolean
  onClose: () => void
  transactions: Transaction[]
}

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    id: 'txn-1642781234567',
    type: 'sale',
    lineItems: [
      {
        id: 'item-1',
        product: {
          id: '1',
          sku: 'WH-001',
          name: 'Wireless Headphones',
          description: 'Premium noise-cancelling wireless headphones',
          price: 199.99,
          cost: 120.00
        },
        quantity: 2,
        unitPrice: 199.99,
        totalPrice: 399.98
      },
      {
        id: 'item-2',
        product: {
          id: '2',
          sku: 'UC-002',
          name: 'USB-C Cable',
          description: 'High-speed USB-C charging cable 2m',
          price: 24.99,
          cost: 8.50
        },
        quantity: 1,
        unitPrice: 24.99,
        totalPrice: 24.99
      }
    ],
    subtotal: 424.97,
    tax: 67.99,
    taxRate: 0.16,
    total: 492.96,
    notes: 'Customer requested express shipping',
    createdAt: new Date('2024-01-21T10:30:00'),
    createdBy: 'admin',
    status: 'completed'
  },
  {
    id: 'txn-1642781234568',
    type: 'stock_addition',
    lineItems: [
      {
        id: 'item-3',
        product: {
          id: '3',
          sku: 'BS-003',
          name: 'Bluetooth Speaker',
          description: 'Portable waterproof Bluetooth speaker',
          price: 89.99,
          cost: 45.00
        },
        quantity: 50,
        unitPrice: 45.00,
        totalPrice: 2250.00
      }
    ],
    subtotal: 2250.00,
    tax: 360.00,
    taxRate: 0.16,
    total: 2610.00,
    notes: 'Restocking from supplier ABC',
    createdAt: new Date('2024-01-20T14:15:00'),
    createdBy: 'manager1',
    status: 'completed'
  },
  {
    id: 'txn-1642781234569',
    type: 'sale',
    lineItems: [
      {
        id: 'item-4',
        product: {
          id: '1',
          sku: 'WH-001',
          name: 'Wireless Headphones',
          description: 'Premium noise-cancelling wireless headphones',
          price: 199.99,
          cost: 120.00
        },
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99
      }
    ],
    subtotal: 199.99,
    tax: 32.00,
    taxRate: 0.16,
    total: 231.99,
    createdAt: new Date('2024-01-19T16:45:00'),
    createdBy: 'employee1',
    status: 'completed'
  }
]

export function TransactionHistory({ isOpen, onClose, transactions = mockTransactions }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'stock_addition'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all')
  
  // Advanced filtering states
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Sorting states
  const [sortField, setSortField] = useState<'createdAt' | 'total' | 'createdBy' | 'type'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // View states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list')

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const userSet = new Set(transactions.map(t => t.createdBy))
    const users = Array.from(userSet)
    return users.sort()
  }, [transactions])

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = !searchTerm ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.lineItems.some(item =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
      const matchesUser = userFilter === 'all' || transaction.createdBy === userFilter
      
      // Date filtering
      const transactionDate = new Date(transaction.createdAt)
      const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || transactionDate <= new Date(dateTo + 'T23:59:59')
      
      // Amount filtering
      const matchesAmountMin = !amountMin || transaction.total >= parseFloat(amountMin)
      const matchesAmountMax = !amountMax || transaction.total <= parseFloat(amountMax)
      
      return matchesSearch && matchesType && matchesStatus && matchesUser &&
             matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax
    })

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'total':
          aValue = a.total
          bValue = b.total
          break
        case 'createdBy':
          aValue = a.createdBy.toLowerCase()
          bValue = b.createdBy.toLowerCase()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [transactions, searchTerm, typeFilter, statusFilter, userFilter, dateFrom, dateTo,
      amountMin, amountMax, sortField, sortDirection])

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedTransactions.slice(startIndex, endIndex)
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage])

  // Pagination info
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalTransactions = filteredAndSortedTransactions.length
    const totalSales = filteredAndSortedTransactions.filter((t: Transaction) => t.type === 'sale').length
    const totalStockAdditions = filteredAndSortedTransactions.filter((t: Transaction) => t.type === 'stock_addition').length
    const totalValue = filteredAndSortedTransactions.reduce((sum: number, t: Transaction) => sum + t.total, 0)
    const totalSalesValue = filteredAndSortedTransactions
      .filter((t: Transaction) => t.type === 'sale')
      .reduce((sum: number, t: Transaction) => sum + t.total, 0)
    
    return {
      totalTransactions,
      totalSales,
      totalStockAdditions,
      totalValue,
      totalSalesValue
    }
  }, [filteredAndSortedTransactions])

  // Sorting functions
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Transaction ID', 'Type', 'Date', 'User', 'Items', 'Subtotal', 'Tax', 'Total', 'Status', 'Notes'].join(','),
      ...filteredAndSortedTransactions.map((t: Transaction) => [
        t.id,
        t.type,
        formatDate(t.createdAt),
        t.createdBy,
        t.lineItems.length,
        t.subtotal.toFixed(2),
        t.tax.toFixed(2),
        t.total.toFixed(2),
        t.status,
        (t.notes || '').replace(/,/g, ';')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setStatusFilter('all')
    setUserFilter('all')
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
    setCurrentPage(1)
  }

  const getTransactionIcon = (type: string) => {
    return type === 'sale' ? ShoppingCart : Package
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'sale' 
      ? <Badge className="bg-blue-100 text-blue-800">Sale</Badge>
      : <Badge className="bg-purple-100 text-purple-800">Stock Addition</Badge>
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transaction History
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">{summary.totalTransactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sales</p>
                      <p className="text-2xl font-bold text-blue-600">{summary.totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Additions</p>
                      <p className="text-2xl font-bold text-purple-600">{summary.totalStockAdditions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalValue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Basic Filters */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Types</option>
                    <option value="sale">Sales</option>
                    <option value="stock_addition">Stock Additions</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showAdvancedFilters ? 'Hide' : 'More'} Filters
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Date From</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Date To</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">User</label>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">All Users</option>
                      {uniqueUsers.map(user => (
                        <option key={user} value={user}>{user}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Items Per Page</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Min Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Max Amount</label>
                    <Input
                      type="number"
                      placeholder="999999.99"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort By</label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="createdAt">Date</option>
                      <option value="total">Amount</option>
                      <option value="createdBy">User</option>
                      <option value="type">Type</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort Order</label>
                    <select
                      value={sortDirection}
                      onChange={(e) => setSortDirection(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {paginatedTransactions.map((transaction: Transaction) => {
                  const Icon = getTransactionIcon(transaction.type)
                  
                  return (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{transaction.id}</span>
                                {getTypeBadge(transaction.type)}
                                {getStatusBadge(transaction.status)}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {transaction.createdBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(transaction.createdAt)}
                                </span>
                                <span>
                                  {transaction.lineItems.length} item{transaction.lineItems.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-lg">{formatCurrency(transaction.total)}</div>
                              <div className="text-sm text-muted-foreground">
                                Subtotal: {formatCurrency(transaction.subtotal)}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {transaction.notes && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                            <strong>Notes:</strong> {transaction.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                
                {filteredAndSortedTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedTransactions.length > itemsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {startItem} to {endItem} of {filteredAndSortedTransactions.length} transactions
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2
                        })
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
           </div>
         </div>
       </DialogContent>
     </Dialog>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTransaction.type === 'sale' ? (
                  <ShoppingCart className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
                Transaction Details - {selectedTransaction.id}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <div className="mt-1 font-medium">{selectedTransaction.createdBy}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <div className="mt-1 font-medium">{formatDate(selectedTransaction.createdAt)}</div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Items ({selectedTransaction.lineItems.length})</h3>
                <div className="space-y-3">
                  {selectedTransaction.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.product.name}</span>
                          <Badge variant="outline">{item.product.sku}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.product.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-muted-foreground">Quantity</div>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Unit Price</div>
                          <div className="font-medium">{formatCurrency(item.unitPrice)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({(selectedTransaction.taxRate * 100).toFixed(1)}%):</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedTransaction.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTransaction.notes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}