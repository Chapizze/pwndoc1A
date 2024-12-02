import { axiosInstance } from '../boot/axios'


export default {
  getClients: async () => {
    return axiosInstance.get('clients')
  },

  createClient: async (client) => {
    return axiosInstance.post('clients', client)
  },

  updateClient: async (clientId, client) => {
    return axiosInstance.put(`clients/${clientId}`, client)
  },

  deleteClient: async (clientId) => {
    return axiosInstance.delete(`clients/${clientId}`)
  }
}