<template>
    <div>
      <q-drawer 
        side="left" 
        :model-value="true" 
        show-if-above
        bordered
      >
        <q-list class="home-drawer">
          <q-item-label header>{{ t('handleCustomData') }}</q-item-label>
      
          <q-separator />
      
          <q-item to="/data/collaborators" clickable :active="false">
            <q-item-section avatar>
              <q-icon name="fa fa-users" />
            </q-item-section>
            <q-item-section>{{ t('collaborators') }}</q-item-section>
          </q-item>
          <q-item to="/data/companies" clickable :active="false">
            <q-item-section avatar>
              <q-icon name="fa fa-building" />
            </q-item-section>
            <q-item-section>{{ t('companies') }}</q-item-section>
          </q-item>
          <q-item to="/data/clients" clickable :active="false">
            <q-item-section avatar>
              <q-icon name="fa fa-user-tie" />
            </q-item-section>
            <q-item-section>{{ t('clients') }}</q-item-section>
          </q-item>
          <q-item to="/data/templates" clickable :active="false">
            <q-item-section avatar>
              <q-icon name="fa fa-file-word" />
            </q-item-section>
            <q-item-section>{{ t('templates') }}</q-item-section>
          </q-item>
  
          <q-separator spaced />
  
          <q-item to="/data/custom" clickable :active="false" >
            <q-item-section avatar>
              <q-icon name="fa fa-table" />
            </q-item-section>
            <q-item-section>{{ t('customData') }}</q-item-section>
          </q-item>
          <q-item to="/data/dump" clickable :active="false">
            <q-item-section avatar>
              <q-icon name="fa fa-archive" />
            </q-item-section>
            <q-item-section>{{ t('import') }} / {{ t('export') }}</q-item-section>
          </q-item>
        </q-list>
      </q-drawer>
      <router-view />     
    </div>
  </template>
  
  <script>
  import { defineComponent } from 'vue'
  import { useI18n } from 'vue-i18n'
  import Breadcrumb from 'components/breadcrumb'
  import { user, isAllowed} from '@/services/user'
  
  export default defineComponent({
    components: {
      Breadcrumb
    },
    
    setup() {
      const { t } = useI18n()
      
      return { 
        t,
        user,
        isAllowed 
      }
    }
  })
  </script>