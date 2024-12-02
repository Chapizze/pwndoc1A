import { ref, reactive, onMounted } from 'vue';
import { Dialog, Notify } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  user,
  getProfile,
  updateProfile,
  getTotpQrCode,
  setupTotp,
  cancelTotp,
  refreshToken,
} from '@/services/user';

export default {
  setup() {
    const { t } = useI18n();
    const totpEnabled = ref(false);
    const totpQrcode = ref('');
    const totpSecret = ref('');
    const totpToken = ref('');
    const errors = reactive({
      username: '',
      firstname: '',
      lastname: '',
      currentPassword: '',
      newPassword: '',
    });

    const fetchProfile = () => {
      getProfile()
        .then((data) => {
          Object.assign(user.value, data.data.datas);
          totpEnabled.value = user.value.totpEnabled;
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const fetchTotpQrCode = () => {
      if (totpEnabled.value && !user.value.totpEnabled) {
        getTotpQrCode()
          .then((data) => {
            const res = data.data.datas;
            totpQrcode.value = res.totpQrCode;
            totpSecret.value = res.totpSecret;
          })
          .catch((err) => {
            console.log(err);
          });
      } else if (!totpEnabled.value && user.value.totpEnabled) {
        // Focus on the input element if needed
      } else {
        totpQrcode.value = '';
        totpSecret.value = '';
        totpToken.value = '';
      }
    };

    const enableTotp = () => {
      setupTotp(totpToken.value, totpSecret.value)
        .then(() => {
          user.value.totpEnabled = true;
          totpToken.value = '';
          Notify.create({
            message: 'TOTP successfully enabled',
            color: 'positive',
            textColor: 'white',
            position: 'top-right',
          });
        })
        .catch(() => {
          Notify.create({
            message: 'TOTP verification failed',
            color: 'negative',
            textColor: 'white',
            position: 'top-right',
          });
        });
    };

    const disableTotp = () => {
      cancelTotp(totpToken.value)
        .then(() => {
          user.value.totpEnabled = false;
          totpToken.value = '';
          Notify.create({
            message: 'TOTP successfully disabled',
            color: 'positive',
            textColor: 'white',
            position: 'top-right',
          });
        })
        .catch(() => {
          Notify.create({
            message: 'TOTP verification failed',
            color: 'negative',
            textColor: 'white',
            position: 'top-right',
          });
        });
    };

    const saveProfile = () => {
      cleanErrors();
      if (!user.value.username) errors.username = t('msg.usernameRequired');
      if (!user.value.firstname) errors.firstname = t('msg.firstnameRequired');
      if (!user.value.lastname) errors.lastname = t('msg.lastnameRequired');

      if (errors.username || errors.firstname || errors.lastname) return;

      updateProfile(user.value)
        .then(() => {
          refreshToken();
          Notify.create({
            message: t('msg.profileUpdateOk'),
            color: 'positive',
            textColor: 'white',
            position: 'top-right',
          });
        })
        .catch((err) => {
          Notify.create({
            message: err.response.data.datas,
            color: 'negative',
            textColor: 'white',
            position: 'top-right',
          });
        });
    };

    const cleanErrors = () => {
      errors.username = '';
      errors.firstname = '';
      errors.lastname = '';
      errors.currentPassword = '';
      errors.newPassword = '';
    };

    onMounted(() => {
      fetchProfile();
    });

    return {
      t,
      user,
      totpEnabled,
      totpQrcode,
      totpSecret,
      totpToken,
      errors,
      fetchProfile,
      fetchTotpQrCode,
      enableTotp,
      disableTotp,
      saveProfile,
      cleanErrors,
    };
  },
};