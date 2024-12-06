import { axiosInstance } from '../boot/axios'

export default {
  getRoles: async () => {
    return axiosInstance.get('data/roles')
  },

  getLanguages: async () => {
    return axiosInstance.get('data/languages')
  },

  createLanguage: async (language) => {
    return axiosInstance.post('data/languages', language)
  },

  deleteLanguage: async (locale) => {
    return axiosInstance.delete(`data/languages/${locale}`)
  },

  updateLanguages: async (languages) => {
    return axiosInstance.put('data/languages', languages)
  },

  getAuditTypes: async () => {
    return axiosInstance.get('data/audit-types')
  },

  createAuditType: async (auditType) => {
    return axiosInstance.post('data/audit-types', auditType)
  },

  deleteAuditType: async (name) => {
    return axiosInstance.delete(`data/audit-types/${name}`)
  },

  updateAuditTypes: async (auditTypes) => {
    return axiosInstance.put('data/audit-types', auditTypes)
  },

  getVulnerabilityTypes: async () => {
    return axiosInstance.get('data/vulnerability-types')
  },

  createVulnerabilityType: async (vulnerabilityType) => {
    return axiosInstance.post('data/vulnerability-types', vulnerabilityType)
  },

  deleteVulnerabilityType: async (name) => {
    return axiosInstance.delete(`data/vulnerability-types/${name}`)
  },

  updateVulnTypes: async (vulnTypes) => {
    return axiosInstance.put('data/vulnerability-types', vulnTypes)
  },

  getVulnerabilityCategories: async () => {
    return axiosInstance.get('data/vulnerability-categories')
  },

  createVulnerabilityCategory: async (vulnerabilityCategory) => {
    return axiosInstance.post('data/vulnerability-categories', vulnerabilityCategory)
  },

  updateVulnerabilityCategories: async (vulnCategories) => {
    return axiosInstance.put('data/vulnerability-categories', vulnCategories)
  },

  deleteVulnerabilityCategory: async (name) => {
    return axiosInstance.delete(`data/vulnerability-categories/${name}`)
  },

  getCustomFields: async () => {
    return axiosInstance.get('data/custom-fields')
  },

  createCustomField: async (customField) => {
    return axiosInstance.post('data/custom-fields', customField)
  },

  updateCustomFields: async (customFields) => {
    return axiosInstance.put('data/custom-fields', customFields)
  },

  deleteCustomField: async (customFieldId) => {
    return axiosInstance.delete(`data/custom-fields/${customFieldId}`)
  },

  getSections: async () => {
    return axiosInstance.get('data/sections')
  },

  getSectionsByLanguage: async (locale) => {
    return axiosInstance.get(`data/sections/${locale}`)
  },

  createSection: async (section) => {
    return axiosInstance.post('data/sections', section)
  },

  deleteSection: async (field, locale) => {
    return axiosInstance.delete(`data/sections/${field}/${locale}`)
  },

  updateSections: async (sections) => {
    return axiosInstance.put('data/sections', sections)
  }
}