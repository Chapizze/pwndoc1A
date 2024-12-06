import { axiosInstance } from '../boot/axios'

export default {
  getSettings: async () => {
    return axiosInstance.get(`settings`)
  },

  getPublicSettings: async () => {
    return axiosInstance.get(`settings/public`)
  },

  updateSettings: async (params) => {
    return axiosInstance.put(`settings`, params)
  },

  exportSettings: async () => {
    return axiosInstance.get(`settings/export`)
  },

  revertDefaults: async () => {
    return axiosInstance.put(`settings/revert`)
  },
}