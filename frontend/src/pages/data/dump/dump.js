import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { Dialog, Notify } from 'quasar';
import YAML from 'yaml'


import VulnerabilityService from '@/services/vulnerability';
import {user, isAllowed} from '@/services/user';

import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const vulnerabilities = ref([]);
    const { proxy } = getCurrentInstance();
    const importVulnerabilities = ref(null)

    const getVulnerabilities = async () => {
      vulnerabilities.value = [];
      try {
        const data = await VulnerabilityService.exportVulnerabilities();
        vulnerabilities.value = data.data.datas;
        downloadVulnerabilities();
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const createVulnerabilities = async () => {
      try {
        const data = await VulnerabilityService.createVulnerabilities(vulnerabilities.value);
        let message = '';
        let color = 'positive';
        if (data.data.datas.duplicates === 0) {
          message = t('importVulnerabilitiesOk', [data.data.datas.created]);
        } else if (data.data.datas.created === 0 && data.data.datas.duplicates > 0) {
          message = t('importVulnerabilitiesAllExists', [data.data.datas.duplicates.length]);
          color = 'negative';
        } else {
          message = t('importVulnerabilitiesPartial', [data.data.datas.created, data.data.datas.duplicates.length]);
          color = 'orange';
        }
        Notify.create({
          message: message,
          html: true,
          closeBtn: 'x',
          color: color,
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

    const handleImportVulnerabilities = (files) => {
        vulnerabilities.value = [];
        let pending = 0;
        
        for (let i = 0; i < files.length; i++) {
          ((file) => {
            const fileReader = new FileReader();
            fileReader.onloadend = (e) => {
              let vulnFile;
              const ext = file.name.split('.').pop();
              
              if (ext === 'yml') {
                try {
                  vulnFile = YAML.parse(fileReader.result);
                  if (typeof vulnFile === 'object') {
                    if (Array.isArray(vulnFile)) {
                      vulnFile.forEach((vuln) => {
                        if (vuln.remediationBackground && vuln.remediationBackground.length > 0) {
                          vuln.details.forEach((d) => {
                            if (!d.remediationBackground || d.remediationBackground.length === 0) {
                              d.remediationBackground = vuln.remediationBackground;
                            }
                          });
                        }
                      });
                      vulnerabilities.value = vulnFile;
                    } else {
                      vulnerabilities.value.push(vulnFile);
                    }
                  } else {
                    throw new Error('Invalid YAML format');
                  }
                } catch (err) {
                  console.log(err);
                  let errMsg = err;
                  if (err.mark) errMsg = `Parsing error at line ${err.mark.line}, column ${err.mark.column}`;
                  Notify.create({
                    message: errMsg,
                    color: 'negative',
                    textColor: 'white',
                    position: 'top-right',
                  });
                  return;
                }
              } else if (ext === 'json') {
                try {
                  vulnFile = JSON.parse(fileReader.result);
                  if (typeof vulnFile === 'object') {
                    if (Array.isArray(vulnFile)) {
                      if (vulnFile.length > 0 && vulnFile[0].id) {
                        vulnerabilities.value = parseSerpico(vulnFile);
                      } else {
                        vulnerabilities.value = vulnFile;
                      }
                    } else {
                      vulnerabilities.value.push(vulnFile);
                    }
                  } else {
                    throw new Error('Invalid JSON format');
                  }
                } catch (err) {
                  console.log(err);
                  let errMsg = err.message || err;
                  Notify.create({
                    message: errMsg,
                    color: 'negative',
                    textColor: 'white',
                    position: 'top-right',
                  });
                  return;
                }
              } else {
                console.log('Bad Extension');
              }
              
              pending--;
              if (pending === 0) {
                createVulnerabilities(); // Make sure this function is defined
              }
            };
            
            pending++;
            fileReader.readAsText(file);
          })(files[i]);
        }
      };

      const triggerFileInput = () => {
        if (importVulnerabilities.value) {
          importVulnerabilities.value.click();
        }
      };

    const parseSerpico = (vulnerabilities) => {
      const result = [];
      vulnerabilities.forEach((vuln) => {
        var tmpVuln = {};
        tmpVuln.cvssv3 = vuln.c3_vs || null;
        tmpVuln.priority = null;
        tmpVuln.remediationComplexity = null;
        var details = {};
        details.locale = this.formatSerpicoText(vuln.language) || 'en';
        details.title = this.formatSerpicoText(vuln.title);
        details.vulnType = this.formatSerpicoText(vuln.type);
        details.description = this.formatSerpicoText(vuln.overview);
        details.observation = this.formatSerpicoText(vuln.poc);
        details.remediation = this.formatSerpicoText(vuln.remediation);
        details.references = []
        if (vuln.references && vuln.references !== "") {
            vuln.references = vuln.references.replace(/<paragraph>/g, '')
            details.references = vuln.references.split('</paragraph>').filter(Boolean)
        }
        tmpVuln.details = [details];
        
        result.push(tmpVuln);
      });

      return result;
    };

    const formatSerpicoText = (str) => {
      if (!str) return null;
      if (str === 'English') return 'en';
      if (str === 'French') return 'fr';

      let res = str;
      // Headers (used as bold in Serpico)
      res = res.replace(/<h4>/g, '<b>');
      res = res.replace(/<\/h4>/g, '</b>');
      // First level bullets
      res = res.replace(/<paragraph><bullet>/g, '<li><p>');
      res = res.replace(/<\/bullet><\/paragraph>/g, '</p></li>');
      // Nested bullets (used as first level bullets)
      res = res.replace(/<paragraph><bullet1>/g, '<li><p>');
      res = res.replace(/<\/bullet1><\/paragraph>/g, '</p></li>');
      // Replace the paragraph tags and simply add linebreaks
      res = res.replace(/<paragraph>/g, '<p>');
      res = res.replace(/<\/paragraph>/g, '</p>');
      // Indented text
      res = res.replace(/<indented>/g, '    ');
      res = res.replace(/<\/indented>/g, '');
      // Italic
      res = res.replace(/<italics>/g, '<i>');
      res = res.replace(/<\/italics>/g, '</i>');
      // Code
      res = res.replace(/\[\[\[/g, '<pre><code>');
      res = res.replace(/]]]/g, '</code></pre>');
      // Apostroph
      res = _.unescape(res);

      res = res.replace(/\n$/, '');

      return res;
    };

    const downloadVulnerabilities = () => {
      console.log(YAML)
      const data = YAML.dump(vulnerabilities.value);
      console.log(data);
      const blob = new Blob([data], { type: 'application/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vulnerabilities.yml';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    };

    const deleteAllVulnerabilities = () => {
      Dialog.create({
        title: t('msg.confirmSuppression'),
        message: t('msg.allVulnerabilitesDeleteNotice'),
        ok: { label: t('btn.confirm'), color: 'negative' },
        cancel: { label: t('btn.cancel'), color: 'white' },
      }).onOk(async () => {
        try {
          await VulnerabilityService.deleteAllVulnerabilities();
          Notify.create({
            message: t('msg.allVulnerabilitesDeleteOk'),
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
      });
    };

    onMounted(() => {
      // Any code to run on component mount
    });

    return {
      t,
      proxy,
      vulnerabilities,
      isAllowed,
      user,
      getVulnerabilities,
      createVulnerabilities,
      importVulnerabilities,
      parseSerpico,
      formatSerpicoText,
      downloadVulnerabilities,
      deleteAllVulnerabilities,
      triggerFileInput,
      handleImportVulnerabilities,
    };
  },
};