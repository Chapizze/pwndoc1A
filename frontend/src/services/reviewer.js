import { axiosInstance } from '../boot/axios'

export default {
  getReviewers: async () => {
    return axiosInstance.get(`users/reviewers`)
  }
}