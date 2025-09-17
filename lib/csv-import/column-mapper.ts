// ============================================================================
// INTELLIGENT COLUMN MAPPING SYSTEM
// ============================================================================

import { 
  CSVColumn, 
  ColumnMapping, 
  InventoryFieldMapping, 
  ColumnMappingRule,
  COLUMN_MAPPING_RULES 
} from './types'

export class ColumnMapper {
  private mappingRules: ColumnMappingRule[]

  constructor(mappingRules: ColumnMappingRule[] = COLUMN_MAPPING_RULES) {
    this.mappingRules = mappingRules
  }

  /**
   * Automatically map CSV columns to inventory fields
   */
  autoMapColumns(columns: CSVColumn[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = []
    const usedFields = new Set<keyof InventoryFieldMapping>()

    // Sort columns by confidence and data type relevance
    const sortedColumns = [...columns].sort((a, b) => {
      // Prioritize columns with higher confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }
      // Prioritize string columns for text fields, number columns for numeric fields
      return this.getDataTypePriority(b.dataType) - this.getDataTypePriority(a.dataType)
    })

    for (const column of sortedColumns) {
      const bestMatch = this.findBestFieldMatch(column, usedFields)
      
      if (bestMatch) {
        mappings.push({
          csvColumn: column.header,
          inventoryField: bestMatch.field,
          isRequired: bestMatch.required,
          isMapped: true,
          confidence: bestMatch.confidence,
          transformation: bestMatch.transformation
        })
        usedFields.add(bestMatch.field)
      } else {
        // Unmapped column
        mappings.push({
          csvColumn: column.header,
          inventoryField: 'notes' as keyof InventoryFieldMapping, // Default fallback
          isRequired: false,
          isMapped: false,
          confidence: 0,
          transformation: undefined
        })
      }
    }

    return mappings
  }

  /**
   * Find the best field match for a CSV column
   */
  private findBestFieldMatch(
    column: CSVColumn, 
    usedFields: Set<keyof InventoryFieldMapping>
  ): {
    field: keyof InventoryFieldMapping
    confidence: number
    required: boolean
    transformation?: (value: string) => any
  } | null {
    let bestMatch: {
      field: keyof InventoryFieldMapping
      confidence: number
      required: boolean
      transformation?: (value: string) => any
    } | null = null

    for (const rule of this.mappingRules) {
      // Skip if field is already used
      if (usedFields.has(rule.field)) continue

      const confidence = this.calculateMatchConfidence(column, rule)
      
      if (confidence > 0.3 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          field: rule.field,
          confidence,
          required: rule.required,
          transformation: rule.transformation
        }
      }
    }

    return bestMatch
  }

  /**
   * Calculate confidence score for a column-rule match
   */
  private calculateMatchConfidence(column: CSVColumn, rule: ColumnMappingRule): number {
    let confidence = 0

    // Check header name similarity
    const headerSimilarity = this.calculateStringSimilarity(
      column.header.toLowerCase(),
      rule.patterns.map(p => p.toLowerCase())
    )
    confidence += headerSimilarity * 0.6

    // Check data type compatibility
    const dataTypeCompatibility = this.checkDataTypeCompatibility(column.dataType, rule.dataType)
    confidence += dataTypeCompatibility * 0.3

    // Apply rule weight
    confidence *= rule.weight

    // Check sample values for additional context
    const sampleValueConfidence = this.analyzeSampleValues(column.sampleValues, rule)
    confidence += sampleValueConfidence * 0.1

    return Math.min(confidence, 1.0)
  }

  /**
   * Calculate string similarity between header and patterns
   */
  private calculateStringSimilarity(header: string, patterns: string[]): number {
    let maxSimilarity = 0

    for (const pattern of patterns) {
      // Exact match
      if (header === pattern) {
        return 1.0
      }

      // Contains match
      if (header.includes(pattern) || pattern.includes(header)) {
        maxSimilarity = Math.max(maxSimilarity, 0.8)
        continue
      }

      // Fuzzy match using Levenshtein distance
      const similarity = this.calculateLevenshteinSimilarity(header, pattern)
      maxSimilarity = Math.max(maxSimilarity, similarity)
    }

    return maxSimilarity
  }

  /**
   * Calculate Levenshtein similarity between two strings
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    const distance = matrix[str2.length][str1.length]
    const maxLength = Math.max(str1.length, str2.length)
    
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
  }

  /**
   * Check data type compatibility
   */
  private checkDataTypeCompatibility(columnType: string, ruleType: string): number {
    if (columnType === ruleType) return 1.0
    
    // Allow some flexibility
    const compatibleTypes: Record<string, string[]> = {
      'string': ['unknown'],
      'number': ['string'], // Numbers can be stored as strings
      'boolean': ['string'],
      'date': ['string']
    }

    if (compatibleTypes[ruleType]?.includes(columnType)) {
      return 0.7
    }

    return 0.2
  }

  /**
   * Analyze sample values for additional context
   */
  private analyzeSampleValues(sampleValues: string[], rule: ColumnMappingRule): number {
    if (sampleValues.length === 0) return 0

    let confidence = 0
    let validCount = 0

    for (const value of sampleValues) {
      if (rule.validation) {
        const validation = rule.validation(value)
        if (validation.isValid) {
          validCount++
        }
      } else {
        // Basic validation based on data type
        switch (rule.dataType) {
          case 'number':
            if (!isNaN(Number(value))) validCount++
            break
          case 'boolean':
            const normalized = value.toLowerCase().trim()
            if (['true', 'false', 'yes', 'no', '1', '0', 'activo', 'inactivo'].includes(normalized)) {
              validCount++
            }
            break
          case 'date':
            if (!isNaN(Date.parse(value))) validCount++
            break
          case 'string':
            validCount++ // Strings are generally valid
            break
        }
      }
    }

    confidence = validCount / sampleValues.length
    return confidence
  }

  /**
   * Get data type priority for sorting
   */
  private getDataTypePriority(dataType: string): number {
    const priorities: Record<string, number> = {
      'string': 3,
      'number': 2,
      'boolean': 1,
      'date': 2,
      'unknown': 0
    }
    return priorities[dataType] || 0
  }

  /**
   * Suggest field mappings for unmapped columns
   */
  suggestMappings(columns: CSVColumn[], currentMappings: ColumnMapping[]): {
    column: string
    suggestions: {
      field: keyof InventoryFieldMapping
      confidence: number
      reason: string
    }[]
  }[] {
    const suggestions: {
      column: string
      suggestions: {
        field: keyof InventoryFieldMapping
        confidence: number
        reason: string
      }[]
    }[] = []

    const usedFields = new Set(
      currentMappings
        .filter(m => m.isMapped)
        .map(m => m.inventoryField)
    )

    for (const column of columns) {
      const currentMapping = currentMappings.find(m => m.csvColumn === column.header)
      
      if (!currentMapping || !currentMapping.isMapped) {
        const columnSuggestions: {
          field: keyof InventoryFieldMapping
          confidence: number
          reason: string
        }[] = []

        for (const rule of this.mappingRules) {
          if (usedFields.has(rule.field)) continue

          const confidence = this.calculateMatchConfidence(column, rule)
          
          if (confidence > 0.2) {
            columnSuggestions.push({
              field: rule.field,
              confidence,
              reason: this.generateSuggestionReason(column, rule, confidence)
            })
          }
        }

        if (columnSuggestions.length > 0) {
          suggestions.push({
            column: column.header,
            suggestions: columnSuggestions.sort((a, b) => b.confidence - a.confidence)
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Generate human-readable reason for suggestion
   */
  private generateSuggestionReason(
    column: CSVColumn, 
    rule: ColumnMappingRule, 
    confidence: number
  ): string {
    const reasons: string[] = []

    // Header similarity
    const headerSimilarity = this.calculateStringSimilarity(
      column.header.toLowerCase(),
      rule.patterns.map(p => p.toLowerCase())
    )

    if (headerSimilarity > 0.8) {
      reasons.push('Nombre de columna muy similar')
    } else if (headerSimilarity > 0.5) {
      reasons.push('Nombre de columna similar')
    }

    // Data type match
    if (column.dataType === rule.dataType) {
      reasons.push('Tipo de datos coincide')
    }

    // Sample value validation
    if (column.sampleValues.length > 0) {
      const validCount = column.sampleValues.filter(value => {
        if (rule.validation) {
          return rule.validation(value).isValid
        }
        return true
      }).length

      if (validCount === column.sampleValues.length) {
        reasons.push('Valores de muestra válidos')
      } else if (validCount > column.sampleValues.length / 2) {
        reasons.push('Algunos valores de muestra válidos')
      }
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Coincidencia general'
  }

  /**
   * Validate mapping configuration
   */
  validateMappings(mappings: ColumnMapping[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for required fields
    const requiredFields = this.mappingRules.filter(rule => rule.required)
    const mappedFields = new Set(mappings.filter(m => m.isMapped).map(m => m.inventoryField))

    for (const rule of requiredFields) {
      if (!mappedFields.has(rule.field)) {
        errors.push(`Campo requerido '${rule.field}' no está mapeado`)
      }
    }

    // Check for duplicate mappings
    const fieldCounts: Record<string, number> = {}
    for (const mapping of mappings) {
      if (mapping.isMapped) {
        fieldCounts[mapping.inventoryField] = (fieldCounts[mapping.inventoryField] || 0) + 1
      }
    }

    for (const [field, count] of Object.entries(fieldCounts)) {
      if (count > 1) {
        errors.push(`Campo '${field}' está mapeado múltiples veces`)
      }
    }

    // Check for unmapped columns
    const unmappedColumns = mappings.filter(m => !m.isMapped)
    if (unmappedColumns.length > 0) {
      warnings.push(`${unmappedColumns.length} columnas no están mapeadas`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get mapping statistics
   */
  getMappingStatistics(mappings: ColumnMapping[]): {
    totalColumns: number
    mappedColumns: number
    unmappedColumns: number
    requiredFieldsMapped: number
    totalRequiredFields: number
    averageConfidence: number
  } {
    const totalColumns = mappings.length
    const mappedColumns = mappings.filter(m => m.isMapped).length
    const unmappedColumns = totalColumns - mappedColumns
    
    const requiredFields = this.mappingRules.filter(rule => rule.required)
    const mappedRequiredFields = mappings.filter(m => 
      m.isMapped && requiredFields.some(rule => rule.field === m.inventoryField)
    ).length

    const mappedMappings = mappings.filter(m => m.isMapped)
    const averageConfidence = mappedMappings.length > 0
      ? mappedMappings.reduce((sum, m) => sum + m.confidence, 0) / mappedMappings.length
      : 0

    return {
      totalColumns,
      mappedColumns,
      unmappedColumns,
      requiredFieldsMapped: mappedRequiredFields,
      totalRequiredFields: requiredFields.length,
      averageConfidence
    }
  }
}