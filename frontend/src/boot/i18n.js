import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'
import messages from '@/i18n'

const language = localStorage.getItem('system_language') || 'en-US';
localStorage.setItem('system_language', language);

const i18n = createI18n({
  locale: language,
  fallbackLocale: 'en-US',
  messages,
  legacy: false,
  globalInjection: true
})

export default boot(({ app }) => {
  app.use(i18n)
})

export { i18n }