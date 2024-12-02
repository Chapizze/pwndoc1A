import { Dialog, Notify } from 'quasar';
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';

import CollabService from '@/services/collaborator';
import {user, isAllowed} from '@/services/user';
import DataService from '@/services/data';
import Utils from '@/services/utils';

import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const collabs = ref([]);
    const loading = ref(true);
    const pagination = reactive({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'username',
    });
    const rowsPerPageOptions = [
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: 'All', value: 0 },
    ];
    const search = reactive({ username: '', firstname: '', lastname: '', role: '', email: '', enabled: true });
    const customFilter = Utils.customFilter;
    const errors = reactive({ lastname: '', firstname: '', username: '' });
    const currentCollab = reactive({
      lastname: '',
      firstname: '',
      username: '',
      role: '',
      email: '',
      phone: '',
      totpEnabled: false,
    });
    const idUpdate = ref('');
    const roles = ref([]);

    const dtHeaders = computed(() => [
      { name: 'username', label: t('username'), field: 'username', align: 'left', sortable: true },
      { name: 'firstname', label: t('firstname'), field: 'firstname', align: 'left', sortable: true },
      { name: 'lastname', label: t('lastname'), field: 'lastname', align: 'left', sortable: true },
      { name: 'email', label: t('email'), field: 'email', align: 'left', sortable: true },
      { name: 'role', label: t('role'), field: 'role', align: 'left', sortable: true },
      { name: 'action', label: '', field: 'action', align: 'left', sortable: false },
    ]);

    const getCollabs = async () => {
      loading.value = true;
      try {
        const data = await CollabService.getCollabs();
        collabs.value = data.data.datas || [];
        loading.value = false;
      } catch (err) {
        console.log(err);
      }
    };

    const createCollab = async () => {
      cleanErrors();
      if (!currentCollab.lastname) errors.lastname = t('msg.lastnameRequired');
      if (!currentCollab.firstname) errors.firstname = t('msg.firstnameRequired');
      if (!currentCollab.username) errors.username = t('msg.usernameRequired');
      if (!currentCollab.password) errors.password = t('msg.passwordRequired');

      if (errors.lastname || errors.firstname || errors.username || errors.password) return;

      try {
        await CollabService.createCollab(currentCollab);
        getCollabs();
        proxy.$refs.createModal.hide();
        Notify.create({
          message: t('msg.collaboratorCreatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const updateCollab = async () => {
      cleanErrors();
      if (!currentCollab.lastname) errors.lastname = t('msg.lastnameRequired');
      if (!currentCollab.firstname) errors.firstname = t('msg.firstnameRequired');
      if (!currentCollab.username) errors.username = t('msg.usernameRequired');

      if (errors.lastname || errors.firstname || errors.username) return;

      try {
        await CollabService.updateCollab(idUpdate.value, currentCollab);
        getCollabs();
        proxy.$refs.editModal.hide();
        Notify.create({
          message: t('msg.collaboratorUpdatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const getRoles = async () => {
      try {
        const data = await DataService.getRoles();
        roles.value = data.data.datas || [];
      } catch (err) {
        console.log(err);
      }
    };

    const clone = row => {
      Object.assign(currentCollab, row);
      idUpdate.value = row._id;
    };

    const cleanErrors = () => {
      errors.lastname = '';
      errors.firstname = '';
      errors.username = '';
      errors.password = '';
    };

    const cleanCurrentCollab = () => {
      currentCollab.lastname = '';
      currentCollab.firstname = '';
      currentCollab.username = '';
      currentCollab.role = 'user';
      currentCollab.password = '';
      currentCollab.email = '';
      currentCollab.phone = '';
    };

    const dblClick = (evt, row) => {
      if (isAllowed('users:updates')) {
        clone(row);
        proxy.$refs.editModal.show();
      }
    };

    onMounted(() => {
      getCollabs();
      getRoles();
    });

    return {
      t,
      proxy,
      user,
      isAllowed,
      collabs,
      loading,
      pagination,
      rowsPerPageOptions,
      search,
      customFilter,
      errors,
      currentCollab,
      idUpdate,
      roles,
      dtHeaders,
      getCollabs,
      createCollab,
      updateCollab,
      getRoles,
      clone,
      cleanErrors,
      cleanCurrentCollab,
      dblClick,
    };
  },
};