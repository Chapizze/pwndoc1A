import { Dialog, Notify } from 'quasar';
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';

import CompanyService from '@/services/company';
import Utils from '@/services/utils';

import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const companies = ref([]);
    const loading = ref(true);
    const dtHeaders = computed(() => [
      { name: 'name', label: t('name'), field: 'name', align: 'left', sortable: true },
      { name: 'shortName', label: t('shortName'), field: 'shortName', align: 'left', sortable: true },
      { name: 'logo', label: t('logo'), field: 'logo', align: 'left', sortable: true },
      { name: 'action', label: '', field: 'action', align: 'left', sortable: false },
    ]);
    const pagination = reactive({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'name',
    });
    const rowsPerPageOptions = [
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: 'All', value: 0 },
    ];
    const search = reactive({ name: '' });
    const customFilter = Utils.customFilter;
    const errors = reactive({ name: '' });
    const currentCompany = reactive({
      name: '',
      shortName: '',
      logo: '',
    });
    const idUpdate = ref('');

    const getCompanies = async () => {
      loading.value = true;
      try {
        const data = await CompanyService.getCompanies();
        companies.value = data.data.datas || [];
        loading.value = false;
      } catch (err) {
        console.log(err);
      }
    };

    const createCompany = async () => {
      cleanErrors();
      if (!currentCompany.name) errors.name = t('msg.nameRequired');

      if (errors.name) return;

      try {
        await CompanyService.createCompany(currentCompany);
        getCompanies();
        proxy.$refs.createModal.hide();
        Notify.create({
          message: t('msg.companyCreatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        console.log(err);
        Notify.create({
          message: typeof err === 'string' ? err : err.message,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const updateCompany = async () => {
      cleanErrors();
      if (!currentCompany.name) errors.name = t('msg.nameRequired');

      if (errors.name) return;

      try {
        await CompanyService.updateCompany(idUpdate.value, currentCompany);
        getCompanies();
        proxy.$refs.editModal.hide();
        Notify.create({
          message: t('msg.companyUpdatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.message,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const deleteCompany = async companyId => {
      try {
        await CompanyService.deleteCompany(companyId);
        getCompanies();
        Notify.create({
          message: t('msg.companyDeletedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.message,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const confirmDeleteCompany = company => {
      Dialog.create({
        title: t('msg.confirmSuppression'),
        message: `${t('company')} «${company.name}» ${t('msg.deleteNotice')}`,
        ok: { label: t('btn.confirm'), color: 'positive' },
        cancel: { label: t('btn.cancel'), color: 'negative' },
      }).onOk(() => deleteCompany(company._id));
    };

    const clone = row => {
      cleanCurrentCompany();
      Object.assign(currentCompany, row);
      idUpdate.value = row._id;
    };

    const cleanErrors = () => {
      errors.name = '';
    };

    const cleanCurrentCompany = () => {
      currentCompany.name = '';
      currentCompany.shortName = '';
      currentCompany.logo = '';
    };

    const handleImage = files => {
      const file = files[0];
      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        currentCompany.logo = fileReader.result;
      };

      fileReader.readAsDataURL(file);
    };

    const dblClick = (evt, row) => {
      clone(row);
      proxy.$refs.editModal.show();
    };

    onMounted(() => {
      getCompanies();
    });

    return {
      t,
      proxy,
      companies,
      loading,
      dtHeaders,
      pagination,
      rowsPerPageOptions,
      search,
      customFilter,
      errors,
      currentCompany,
      idUpdate,
      getCompanies,
      createCompany,
      updateCompany,
      deleteCompany,
      confirmDeleteCompany,
      clone,
      cleanErrors,
      cleanCurrentCompany,
      handleImage,
      dblClick,
    };
  },
};