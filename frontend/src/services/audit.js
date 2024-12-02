import { axiosInstance } from '../boot/axios'

export default {
  getAudits: function(filters) {
    var params = {}
    if (filters) {
      if (filters.findingTitle)
        params.findingTitle = filters.findingTitle;
      if (filters.type)
        params.type = filters.type
    }
    return axiosInstance.get('audits', {params: params})
  },

  getAudit: function(auditId) {
    return axiosInstance.get(`audits/${auditId}`)
  },

  createAudit: function(audit) {
    return axiosInstance.post('audits', audit)
  },

  deleteAudit: function(auditId) {
    return axiosInstance.delete(`audits/${auditId}`)
  },

  getAuditGeneral: function(auditId) {
    return axiosInstance.get(`audits/${auditId}/general`)
  },

  updateAuditGeneral: function(auditId, audit) {
    return axiosInstance.put(`audits/${auditId}/general`, audit)
  },

  getAuditNetwork: function(auditId) {
    return axiosInstance.get(`audits/${auditId}/network`)
  },

  updateAuditNetwork: function(auditId, audit) {
    return axiosInstance.put(`audits/${auditId}/network`, audit)
  },

  createFinding: function(auditId, finding) {
    return axiosInstance.post(`audits/${auditId}/findings`, finding)
  },
  
  getFinding: function(auditId, findingId) {
    return axiosInstance.get(`audits/${auditId}/findings/${findingId}`)
  },

  updateFinding: function(auditId, findingId, finding) {
    return axiosInstance.put(`audits/${auditId}/findings/${findingId}`, finding)
  },

  deleteFinding: function(auditId, findingId) {
    return axiosInstance.delete(`audits/${auditId}/findings/${findingId}`)
  },

  getSection: function(auditId, sectionId) {
    return axiosInstance.get(`audits/${auditId}/sections/${sectionId}`)
  },

  updateSection: function(auditId, sectionId, section) {
    return axiosInstance.put(`audits/${auditId}/sections/${sectionId}`, section)
  },

  getAuditTypes: function() {
    return axiosInstance.get(`audits/types`)
  },

  generateAuditReport: function(auditId) {
    return axiosInstance.get(`audits/${auditId}/generate`, {responseType: 'blob'})
  },

  updateAuditSortFindings: function(auditId, audit) {
    return axiosInstance.put(`audits/${auditId}/sortfindings`, audit)
  },

  updateAuditFindingPosition: function(auditId, audit) {
    return axiosInstance.put(`audits/${auditId}/movefinding`, audit)
  },
  
  toggleApproval: function(auditId) {
    return axiosInstance.put(`audits/${auditId}/toggleApproval`);
  },

  updateReadyForReview: function(auditId, data) {
    return axiosInstance.put(`audits/${auditId}/updateReadyForReview`, data);
  },

  getRetest: function(auditId) {
    return axiosInstance.get(`audits/${auditId}/retest`);
  },

  createRetest: function(auditId, data) {
    return axiosInstance.post(`audits/${auditId}/retest`, data);
  },

  updateAuditParent: function(auditId, parentId) {
    return axiosInstance.put(`audits/${auditId}/updateParent`, {parentId: parentId})
  },

  deleteAuditParent: function(auditId) {
    return axiosInstance.delete(`audits/${auditId}/deleteParent`)
  },

  getAuditChildren: function(auditId) {
    return axiosInstance.get(`audits/${auditId}/children`);
  },

  createComment: function(auditId, comment) {
    return axiosInstance.post(`audits/${auditId}/comments`, comment);
  },

  deleteComment: function(auditId, commentId) {
    return axiosInstance.delete(`audits/${auditId}/comments/${commentId}`)
  },

  updateComment: function(auditId, comment) {
    return axiosInstance.put(`audits/${auditId}/comments/${comment._id}`, comment)
  },
}