import {refreshToken, isAuth} from '@/services/user'
import config from '../config/config.json'
import { ref } from 'vue'
import router from '../router/index'

const isSSO = config.isSSO

export function setupNavigation() {
  // Create a ref to track authentication status
  const tokenRefreshInterval = ref(null)

  // Function to handle token refresh and redirection
  const handleTokenRefreshError = (err) => {
    //SSO redirection
    if (isSSO) {
      if (!router.currentRoute.value.path.startsWith('/api/sso'))
        if (err === 'Expired refreshToken')
          router.push('/api/sso?tokenError=2')
        else
          router.push('/api/sso')
    }
    else {
      if (!router.currentRoute.value.path.startsWith('/login'))
        if (err === 'Expired refreshToken')
          router.push('/login?tokenError=2')
        else
          router.push('/login')
    }
  }

  // Initial token refresh and setup
  const initTokenRefresh = async () => {
    // Launch refresh token countdown 840000=14min if not on login page
    tokenRefreshInterval.value = setInterval(() => {
      refreshToken()
        .then()
        .catch(err => handleTokenRefreshError(err))
    }, 840000)

    // Call refreshToken when loading app and redirect to login if error
    try {
      await refreshToken()
    }
    catch (err) {
      handleTokenRefreshError(err)
    }
  }

  // Add navigation guard directly to the router
  router.beforeEach((to, from) => {
    //SSO Integration 
    if (isSSO) {
      if (to.path === '/api/sso') {
        if (isAuth())
          return '/'
        else {
          console.log("router crash")
          return '/api/sso'
        }
      }
      return true
    }
    else {
      if (to.path === '/login') {
        if (isAuth())
          return '/'
        return true
      }
      return true
    }
  })

  // Initial token refresh
  initTokenRefresh()

  // Return cleanup function
  return () => {
    if (tokenRefreshInterval.value) {
      clearInterval(tokenRefreshInterval.value)
    }
  }
}