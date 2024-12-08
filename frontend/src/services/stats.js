import { axiosInstance } from '../boot/axios'

export default {
  getFindingsByCategory: async () => {
    return axiosInstance.get(`stats/findingByCategory`)
  },

  getFindingsBySeverity: async (year) => {
    return axiosInstance.get(`stats/findingBySeverity/${year}`)
  }

}