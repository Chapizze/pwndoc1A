import { axiosInstance } from '../boot/axios'

export default {
  getAudits: function(filters) {
    let queryParams = ''
    if (filters) {
      if (filters.findingTitle)
        queryParams = `?filter=${filters.findingTitle}`
      if (filters.type)
        queryParams = `?filter=${filters.type}`
    }
    return axiosInstance.get(`audits${queryParams}`)
  },

  getAudit: async(auditId) => {
    return axiosInstance.get(`audits/${auditId}`)
  },

  createAudit: async(audit) => {
    return axiosInstance.post('audits', audit)
  },

  deleteAudit: async(auditId) => {
    return axiosInstance.delete(`audits/${auditId}`)
  },

  getAuditGeneral: async(auditId) => {
    return axiosInstance.get(`audits/${auditId}/general`)
  },

  updateAuditGeneral: async(auditId, audit) => {
    return axiosInstance.put(`audits/${auditId}/general`, audit)
  },

  getAuditNetwork: async(auditId) => {
    return axiosInstance.get(`audits/${auditId}/network`)
  },

  updateAuditNetwork: async(auditId, audit) =>  {
    return axiosInstance.put(`audits/${auditId}/network`, audit)
  },

  createFinding: async(auditId, finding) => {
    return axiosInstance.post(`audits/${auditId}/findings`, finding)
  },
  
  getFinding: async(auditId, findingId) => {
    return axiosInstance.get(`audits/${auditId}/findings/${findingId}`)
  },

  updateFinding: async(auditId, findingId, finding) => {
    return axiosInstance.put(`audits/${auditId}/findings/${findingId}`, finding)
  },

  deleteFinding: async(auditId, findingId) => {
    return axiosInstance.delete(`audits/${auditId}/findings/${findingId}`)
  },

  getSection: async(auditId, sectionId) => {
    return axiosInstance.get(`audits/${auditId}/sections/${sectionId}`)
  },

  updateSection: async(auditId, sectionId, section) => {
    return axiosInstance.put(`audits/${auditId}/sections/${sectionId}`, section)
  },

  getAuditTypes: async()  =>{
    return axiosInstance.get(`audits/types`)
  },

  generateAuditReport: async(auditId) =>  {
    return axiosInstance.get(`audits/${auditId}/generate`, {responseType: 'blob'})
  },

  updateAuditSortFindings: async(auditId, audit) => {
    return axiosInstance.put(`audits/${auditId}/sortfindings`, audit)
  },

  updateAuditFindingPosition: async(auditId, audit) => {
    return axiosInstance.put(`audits/${auditId}/movefinding`, audit)
  },
  
  toggleApproval: async(auditId) => {
    return axiosInstance.put(`audits/${auditId}/toggleApproval`);
  },

  updateReadyForReview: async(auditId, data) => {
    return axiosInstance.put(`audits/${auditId}/updateReadyForReview`, data);
  },

  getRetest: async(auditId) => {
    return axiosInstance.get(`audits/${auditId}/retest`);
  },

  createRetest: async(auditId, data) => {
    return axiosInstance.post(`audits/${auditId}/retest`, data);
  },

  updateAuditParent: async(auditId, parentId) => {
    return axiosInstance.put(`audits/${auditId}/updateParent`, {parentId: parentId})
  },

  deleteAuditParent: async(auditId) => {
    return axiosInstance.delete(`audits/${auditId}/deleteParent`)
  },

  getAuditChildren: async(auditId) => {
    return axiosInstance.get(`audits/${auditId}/children`);
  },

  createComment: async(auditId, comment) => {
    return axiosInstance.post(`audits/${auditId}/comments`, comment);
  },

  deleteComment: async(auditId, commentId) => {
    return axiosInstance.delete(`audits/${auditId}/comments/${commentId}`)
  },

  updateComment: async(auditId, comment) => {
    return axiosInstance.put(`audits/${auditId}/comments/${comment._id}`, comment)
  },
}