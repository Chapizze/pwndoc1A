import { axiosInstance } from '../boot/axios'

export default {
  getAttachment: async (auditId, attachmentId) => {
    return axiosInstance.get(`audits/${auditId}/attachments/${attachmentId}`)
  },

  createAttachment: async (auditId, attachment) => {
    return axiosInstance.post(`audits/${auditId}/attachments`, attachment)
  },

  deleteAttachment: async (auditId, attachmentId) => {
    return axiosInstance.delete(`audits/${auditId}/attachments/${attachmentId}`)
  }
}