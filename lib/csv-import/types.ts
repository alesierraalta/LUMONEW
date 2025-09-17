// ============================================================================
// CSV IMPORT SYSTEM TYPES
// ============================================================================

export interface CSVColumn {
  index: number
  header: string
  sampleValues: string[]
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'unknown'
  confidence: number // 0-1, how confident we are in the data type
}

export interface ColumnMapping {
  csvColumn: string
  inventoryField: keyof InventoryFieldMapping
  isRequired: boolean
  isMapped: boolean
  confidence: number
  transformation?: (value: string) => any
}

export interface InventoryFieldMapping {
  sku: string
  name: string
  description?: string
  category: string
  location: string
  price: number
  cost?: number
  quantity: number
  minStock: number
  maxStock?: number
  status: 'active' | 'inactive' | 'discontinued'
  barcode?: string
  tags?: string[]
  supplier?: string
  notes?: string
}

export interface CSVImportData {
  columns: CSVColumn[]
  rows: string[][]
  totalRows: number
  hasHeaders: boolean
  delimiter: string
  encoding: string
}

export interface ImportPreview {
  mappedData: Partial<InventoryFieldMapping>[]
  errors: ImportError[]
  warnings: ImportWarning[]
  statistics: ImportStatistics
}

export interface ImportError {
  row: number
  field: keyof InventoryFieldMapping
  value: string
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface ImportWarning {
  row: number
  field: keyof InventoryFieldMapping
  value: string
  message: string
  suggestion?: string
}

export interface ImportStatistics {
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
  mappedFields: number
  unmappedFields: number
  estimatedImportTime: number // in seconds
}

export interface ImportProgress {
  currentRow: number
  totalRows: number
  percentage: number
  currentOperation: string
  errors: ImportError[]
  warnings: ImportWarning[]
  isComplete: boolean
  isError: boolean
}

export interface ImportResult {
  success: boolean
  importedCount: number
  errorCount: number
  warningCount: number
  errors: ImportError[]
  warnings: ImportWarning[]
  duration: number
  importedItems: Partial<InventoryFieldMapping>[]
  failedItems: {
    row: number
    data: Partial<InventoryFieldMapping>
    error: string
  }[]
}

export interface ColumnMappingRule {
  field: keyof InventoryFieldMapping
  patterns: string[]
  weight: number
  dataType: 'string' | 'number' | 'boolean' | 'date'
  required: boolean
  validation?: (value: string) => { isValid: boolean; message?: string }
  transformation?: (value: string) => any
}

export interface CSVImportConfig {
  maxFileSize: number // in bytes
  allowedDelimiters: string[]
  allowedEncodings: string[]
  batchSize: number
  autoDetectDelimiter: boolean
  autoDetectEncoding: boolean
  skipEmptyRows: boolean
  trimWhitespace: boolean
  caseSensitiveMapping: boolean
  defaultValues: Partial<InventoryFieldMapping>
  validationRules: ColumnMappingRule[]
}

export interface ImportSession {
  id: string
  fileName: string
  fileSize: number
  status: 'uploading' | 'parsing' | 'mapping' | 'preview' | 'importing' | 'completed' | 'error'
  progress: ImportProgress
  config: CSVImportConfig
  data?: CSVImportData
  mappings?: ColumnMapping[]
  preview?: ImportPreview
  result?: ImportResult
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// COLUMN MAPPING RULES FOR INTELLIGENT DETECTION
// ============================================================================

export const COLUMN_MAPPING_RULES: ColumnMappingRule[] = [
  {
    field: 'sku',
    patterns: [
      'sku', 'codigo', 'code', 'product_code', 'item_code', 'id', 'product_id',
      'item_id', 'reference', 'ref', 'articulo', 'artículo', 'cod', 'código'
    ],
    weight: 1.0,
    dataType: 'string',
    required: true,
    validation: (value) => ({
      isValid: /^[A-Za-z0-9\-_]+$/.test(value.trim()),
      message: 'SKU debe contener solo letras, números, guiones y guiones bajos'
    })
  },
  {
    field: 'name',
    patterns: [
      'name', 'nombre', 'producto', 'product', 'item', 'description', 'descripcion',
      'descripción', 'title', 'titulo', 'título', 'product_name', 'item_name'
    ],
    weight: 1.0,
    dataType: 'string',
    required: true,
    validation: (value) => ({
      isValid: value.trim().length > 0,
      message: 'El nombre del producto es requerido'
    })
  },
  {
    field: 'description',
    patterns: [
      'description', 'descripcion', 'descripción', 'details', 'detalles',
      'notes', 'notas', 'comments', 'comentarios', 'long_description'
    ],
    weight: 0.8,
    dataType: 'string',
    required: false
  },
  {
    field: 'category',
    patterns: [
      'category', 'categoria', 'categoría', 'type', 'tipo', 'group', 'grupo',
      'class', 'clase', 'classification', 'clasificacion', 'clasificación'
    ],
    weight: 0.9,
    dataType: 'string',
    required: false
  },
  {
    field: 'location',
    patterns: [
      'location', 'ubicacion', 'ubicación', 'place', 'lugar', 'warehouse',
      'almacen', 'almacén', 'storage', 'almacenamiento', 'shelf', 'estante'
    ],
    weight: 0.8,
    dataType: 'string',
    required: false
  },
  {
    field: 'price',
    patterns: [
      'price', 'precio', 'cost', 'costo', 'unit_price', 'precio_unitario',
      'selling_price', 'precio_venta', 'retail_price', 'precio_retail',
      'list_price', 'precio_lista', 'value', 'valor'
    ],
    weight: 0.9,
    dataType: 'number',
    required: false,
    validation: (value) => {
      const num = parseFloat(value.replace(/[,$]/g, ''))
      return {
        isValid: !isNaN(num) && num >= 0,
        message: 'El precio debe ser un número mayor o igual a 0'
      }
    },
    transformation: (value) => parseFloat(value.replace(/[,$]/g, ''))
  },
  {
    field: 'cost',
    patterns: [
      'cost', 'costo', 'unit_cost', 'costo_unitario', 'purchase_price',
      'precio_compra', 'wholesale_price', 'precio_mayorista', 'buy_price'
    ],
    weight: 0.8,
    dataType: 'number',
    required: false,
    validation: (value) => {
      const num = parseFloat(value.replace(/[,$]/g, ''))
      return {
        isValid: !isNaN(num) && num >= 0,
        message: 'El costo debe ser un número mayor o igual a 0'
      }
    },
    transformation: (value) => parseFloat(value.replace(/[,$]/g, ''))
  },
  {
    field: 'quantity',
    patterns: [
      'quantity', 'cantidad', 'stock', 'inventario', 'qty', 'amount',
      'cant', 'inventory', 'available', 'disponible', 'on_hand'
    ],
    weight: 0.9,
    dataType: 'number',
    required: false,
    validation: (value) => {
      const num = parseInt(value, 10)
      return {
        isValid: !isNaN(num) && num >= 0,
        message: 'La cantidad debe ser un número entero mayor o igual a 0'
      }
    },
    transformation: (value) => parseInt(value, 10)
  },
  {
    field: 'minStock',
    patterns: [
      'min_stock', 'stock_minimo', 'stock_mínimo', 'minimum_stock',
      'min_quantity', 'cantidad_minima', 'cantidad_mínima', 'reorder_point',
      'punto_reorden', 'min_level', 'nivel_minimo', 'nivel_mínimo'
    ],
    weight: 0.7,
    dataType: 'number',
    required: false,
    validation: (value) => {
      const num = parseInt(value, 10)
      return {
        isValid: !isNaN(num) && num >= 0,
        message: 'El stock mínimo debe ser un número entero mayor o igual a 0'
      }
    },
    transformation: (value) => parseInt(value, 10)
  },
  {
    field: 'maxStock',
    patterns: [
      'max_stock', 'stock_maximo', 'stock_máximo', 'maximum_stock',
      'max_quantity', 'cantidad_maxima', 'cantidad_máxima', 'max_level',
      'nivel_maximo', 'nivel_máximo', 'capacity', 'capacidad'
    ],
    weight: 0.7,
    dataType: 'number',
    required: false,
    validation: (value) => {
      const num = parseInt(value, 10)
      return {
        isValid: !isNaN(num) && num >= 0,
        message: 'El stock máximo debe ser un número entero mayor o igual a 0'
      }
    },
    transformation: (value) => parseInt(value, 10)
  },
  {
    field: 'status',
    patterns: [
      'status', 'estado', 'state', 'active', 'activo', 'inactive', 'inactivo',
      'enabled', 'habilitado', 'disabled', 'deshabilitado', 'available',
      'disponible', 'condition', 'condicion', 'condición'
    ],
    weight: 0.6,
    dataType: 'string',
    required: false,
    validation: (value) => {
      const normalized = value.toLowerCase().trim()
      const validStatuses = ['active', 'activo', 'inactive', 'inactivo', 'discontinued', 'descontinuado']
      return {
        isValid: validStatuses.includes(normalized),
        message: 'El estado debe ser: active, inactive, o discontinued'
      }
    },
    transformation: (value) => {
      const normalized = value.toLowerCase().trim()
      const statusMap: Record<string, 'active' | 'inactive' | 'discontinued'> = {
        'active': 'active',
        'activo': 'active',
        'inactive': 'inactive',
        'inactivo': 'inactive',
        'discontinued': 'discontinued',
        'descontinuado': 'discontinued'
      }
      return statusMap[normalized] || 'active'
    }
  },
  {
    field: 'barcode',
    patterns: [
      'barcode', 'codigo_barras', 'código_barras', 'ean', 'upc', 'isbn',
      'gtin', 'product_code', 'codigo_producto', 'código_producto'
    ],
    weight: 0.8,
    dataType: 'string',
    required: false,
    validation: (value) => ({
      isValid: /^[0-9]+$/.test(value.trim()),
      message: 'El código de barras debe contener solo números'
    })
  },
  {
    field: 'tags',
    patterns: [
      'tags', 'etiquetas', 'labels', 'etiquetas', 'keywords', 'palabras_clave',
      'categories', 'categorias', 'categorías', 'groups', 'grupos'
    ],
    weight: 0.6,
    dataType: 'string',
    required: false,
    transformation: (value) => value.split(/[,;|]/).map(tag => tag.trim()).filter(tag => tag.length > 0)
  },
  {
    field: 'supplier',
    patterns: [
      'supplier', 'proveedor', 'vendor', 'vendedor', 'manufacturer',
      'fabricante', 'brand', 'marca', 'company', 'empresa'
    ],
    weight: 0.7,
    dataType: 'string',
    required: false
  },
  {
    field: 'notes',
    patterns: [
      'notes', 'notas', 'comments', 'comentarios', 'remarks', 'observaciones',
      'additional_info', 'informacion_adicional', 'información_adicional'
    ],
    weight: 0.5,
    dataType: 'string',
    required: false
  }
]

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CSV_IMPORT_CONFIG: CSVImportConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedDelimiters: [',', ';', '\t', '|'],
  allowedEncodings: ['utf-8', 'latin1', 'windows-1252'],
  batchSize: 100,
  autoDetectDelimiter: true,
  autoDetectEncoding: true,
  skipEmptyRows: true,
  trimWhitespace: true,
  caseSensitiveMapping: false,
  defaultValues: {
    status: 'active',
    quantity: 0,
    price: 0,
    minStock: 0,
    maxStock: 1000
  },
  validationRules: COLUMN_MAPPING_RULES
}