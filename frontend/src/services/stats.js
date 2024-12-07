import { axiosInstance } from '../boot/axios'

export default {
  getFindingByCategory: async () => {
    return axiosInstance.get(`stats/findingByCategory`)
  },

}