import { axiosInstance } from '../boot/axios'

export default {
    rephrase: async (content) => {
        return axiosInstance.post(`ai/rephrase`, content)
    }
}