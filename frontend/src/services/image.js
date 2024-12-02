import { axiosInstance } from '../boot/axios'

export default {
  getImage: async (imageId) => {
    return axiosInstance.get(`images/${imageId}`)
  },

  createImage: async (image) => {
    return axiosInstance.post('images', image)
  },

  deleteImage: async (imageId) => {
    return axiosInstance.delete(`images/${imageId}`)
  }
}