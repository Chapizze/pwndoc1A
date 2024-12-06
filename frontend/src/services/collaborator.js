import { axiosInstance } from '../boot/axios'

export default {
  getCollabs: async () => {
    return axiosInstance.get('users')
  },

  createCollab: async (collab) => {
    return axiosInstance.post('users', collab)
  },

  updateCollab: async (collabId, collab) => {
    return axiosInstance.put(`users/${collabId}`, collab)
  },

  deleteCollab: async (collabId) => {
    return axiosInstance.delete(`users/${collabId}`)
  }
}