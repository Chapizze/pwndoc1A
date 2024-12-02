import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { Notify, Dialog } from 'quasar';

import SettingsService from '@/services/settings';
import {user, isAllowed} from '@/services/user';
import LanguageSelector from '@/components/language-selector';

export default {
  components: {
    LanguageSelector,
  },
  setup() {
    const { t } = useI18n();
    const loading = ref(true);
    const settings = reactive({});
    const settingsOrig = reactive({});
    const canEdit = ref(false);

    const unsavedChanges = () => {
      return JSON.stringify(settingsOrig) !== JSON.stringify(settings);
    };

    const _listener = (e) => {
      if ((window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
        e.preventDefault();
        updateSettings();
      }
    };

    const getSettings = async () => {
      try {
        const data = await SettingsService.getSettings();
        Object.assign(settings, data.data.datas);
        Object.assign(settingsOrig, JSON.parse(JSON.stringify(settings)));
        loading.value = false;
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const updateSettings = async () => {
      const min = 1;
      const max = 99;
      if (settings.reviews.public.minReviewers < min || settings.reviews.public.minReviewers > max) {
        settings.reviews.public.minReviewers = settings.reviews.public.minReviewers < min ? min : max;
      }
      try {
        await SettingsService.updateSettings(settings);
        Object.assign(settingsOrig, JSON.parse(JSON.stringify(settings)));
        Notify.create({
          message: t('msg.settingsUpdatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.message || err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const revertToDefaults = () => {
      Dialog.create({
        title: t('msg.revertingSettings'),
        message: t('msg.revertingSettingsConfirm'),
        ok: { label: t('btn.confirm'), color: 'negative' },
        cancel: { label: t('btn.cancel'), color: 'white' },
      }).onOk(async () => {
        await SettingsService.revertDefaults();
        getSettings();
        Notify.create({
          message: t('settingsUpdatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      });
    };

    const importSettings = (file) => {
      const fileReader = new FileReader();
      fileReader.onloadend = async (e) => {
        try {
          const settings = JSON.parse(fileReader.result);
          if (typeof settings === 'object') {
            Dialog.create({
              title: t('msg.importingSettings'),
              message: t('msg.importingSettingsConfirm'),
              ok: { label: t('btn.confirm'), color: 'negative' },
              cancel: { label: t('btn.cancel'), color: 'white' },
            }).onOk(async () => {
              await SettingsService.updateSettings(settings);
              getSettings();
              Notify.create({
                message: t('msg.settingsImportedOk'),
                color: 'positive',
                textColor: 'white',
                position: 'top-right',
              });
            });
          } else {
            throw t('err.jsonMustBeAnObject');
          }
        } catch (err) {
          console.log(err);
          let errMsg = t('err.importingSettingsError');
          if (err.message) errMsg = t('err.errorWhileParsingJsonContent', [err.message]);
          Notify.create({
            message: errMsg,
            color: 'negative',
            textColor: 'white',
            position: 'top-right',
          });
        }
      };
      const fileContent = new Blob(file, { type: 'application/json' });
      fileReader.readAsText(fileContent);
    };

    const exportSettings = async () => {
      const response = await SettingsService.exportSettings();
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = response.headers['content-disposition'].split('"')[1];
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    onMounted(() => {
      if (isAllowed('settings:read')) {
        getSettings();
        canEdit.value = isAllowed('settings:update');
        document.addEventListener('keydown', _listener, false);
      } else {
        loading.value = false;
      }
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', _listener, false);
    });

    return {
      loading,
      isAllowed,
      user,
      settings,
      settingsOrig,
      canEdit,
      unsavedChanges,
      getSettings,
      updateSettings,
      revertToDefaults,
      importSettings,
      exportSettings,
    };
  },
  beforeRouteLeave(to, from, next) {
    if (this.unsavedChanges()) {
      Dialog.create({
        title: this.t('msg.thereAreUnsavedChanges'),
        message: this.t('msg.doYouWantToLeave'),
        ok: { label: this.t('btn.confirm'), color: 'negative' },
        cancel: { label: this.t('btn.cancel'), color: 'white' },
      }).onOk(() => next());
    } else {
      next();
    }
  },
};