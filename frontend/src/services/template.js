import { axiosInstance } from '../boot/axios'

export default {
  getTemplates: async () => {
    return axiosInstance.get(`templates`)
  },

  createTemplate: async (template) => {
    return axiosInstance.post('templates', template)
  },

  updateTemplate: async (templateId, template) => {
    return axiosInstance.put(`templates/${templateId}`, template)
  },

  deleteTemplate: async (templateId) => {
    return axiosInstance.delete(`templates/${templateId}`)
  },

  downloadTemplate: async (templateId) => {
    return axiosInstance.get(`templates/download/${templateId}`, {responseType: 'blob'})
  }
}