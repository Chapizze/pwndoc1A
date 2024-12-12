import { Dialog, Notify, exportFile } from 'quasar';
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';

import Breadcrumb from 'components/breadcrumb';
import TemplateService from '@/services/template';
import {user, isAllowed} from '@/services/user';
import Utils from '@/services/utils';
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const templates = ref([]);
    const loading = ref(true);
    const dtHeaders = computed(() => [
      { name: 'name', label: t('name'), field: 'name', align: 'left', sortable: true },
      { name: 'ext', label: t('extension'), field: 'ext', align: 'left', sortable: true },
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
    const search = reactive({ name: '', ext: '' });
    const customFilter = Utils.customFilter;
    const errors = reactive({ name: '', file: '' });
    const currentTemplate = reactive({
      name: '',
      file: ''
    });
    const templateId = ref('');

    const getTemplates = async () => {
      loading.value = true;
      try {
        const data = await TemplateService.getTemplates();
        templates.value = data.data.datas || [];
        loading.value = false;
      } catch (err) {
        console.log(err);
      }
    };

    const downloadTemplate = async row => {
      try {
        const data = await TemplateService.downloadTemplate(row._id);
        const status = exportFile(`${row.name}.${row.ext || 'docx'}`, data.data, { type: 'application/octet-stream' });
        if (!status) throw status;
      } catch (err) {
        if (err.response.status === 404) {
          Notify.create({
            message: t('msg.templateNotFound'),
            color: 'negative',
            textColor: 'white',
            position: 'top-right',
          });
        } else {
          console.log(err.response);
        }
      }
    };

    const createTemplate = async () => {
      cleanErrors();
      if (!currentTemplate.name) errors.name = t('msg.nameRequired');
      if (!currentTemplate.file) errors.file = t('msg.fileRequired');

      if (errors.name || errors.file) return;

      try {
        await TemplateService.createTemplate(currentTemplate);
        getTemplates();
        proxy.$refs.createModal.hide();
        Notify.create({
          message: t('msg.templateCreatedOk'),
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

    const updateTemplate = async () => {
      cleanErrors();
      if (!currentTemplate.name) errors.name = t('msg.nameRequired');

      if (errors.name) return;

      try {
        await TemplateService.updateTemplate(templateId.value, currentTemplate);
        getTemplates();
        proxy.$refs.editModal.hide();
        Notify.create({
          message: t('msg.templateUpdatedOk'),
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

    const deleteTemplate = async templateId => {
      try {
        const data = await TemplateService.deleteTemplate(templateId);
        getTemplates();
        Notify.create({
          message: data.data.datas,
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

    const confirmDeleteTemplate = row => {
      Dialog.create({
        title: t('msg.confirmSuppression'),
        message: `${t('template')} «${row.name}» ${t('msg.deleteNotice')}`,
        ok: { label: t('btn.confirm'), color: 'positive' },
        cancel: { label: t('btn.cancel'), color: 'negative' },
      }).onOk(() => deleteTemplate(row._id));
    };

    const clone = row => {
      cleanCurrentTemplate();
      currentTemplate.name = row.name;
      templateId.value = row._id;
    };

    const cleanErrors = () => {
      errors.name = '';
      errors.file = '';
    };

    const cleanCurrentTemplate = () => {
      cleanErrors();
      currentTemplate.name = '';
      currentTemplate.file = '';
      templateId.value = '';
    };

    const handleFile = files => {
      const file = files[0];
      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        currentTemplate.file = fileReader.result.split(',')[1];
      };

      fileReader.readAsDataURL(file);
    };

    const dblClick = (evt, row) => {
      if (isAllowed('templates:update')) {
        clone(row);
        proxy.$refs.editModal.show();
      }
    };

    onMounted(() => {
      getTemplates();
    });

    return {
      t,
      proxy,
      user,
      isAllowed,
      templates,
      loading,
      dtHeaders,
      pagination,
      rowsPerPageOptions,
      search,
      customFilter,
      errors,
      currentTemplate,
      templateId,
      getTemplates,
      downloadTemplate,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      confirmDeleteTemplate,
      clone,
      cleanErrors,
      cleanCurrentTemplate,
      handleFile,
      dblClick,
    };
  },
  components: {
    Breadcrumb,
  },
};