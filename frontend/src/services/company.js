import { axiosInstance } from '../boot/axios'

export default {
  getCompanies: async () => {
    return axiosInstance.get('companies')
  },

  createCompany: async (company) => {
    return axiosInstance.post('companies', company)
  },

  updateCompany: async (companyId, company) => {
    return axiosInstance.put(`companies/${companyId}`, company)
  },

  deleteCompany: async (companyId) => {
    return axiosInstance.delete(`companies/${companyId}`)
  }
}