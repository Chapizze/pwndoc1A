import { Notify, Dialog, QSpinnerGears } from 'quasar';
import BasicEditor from 'components/editor';
import Breadcrumb from 'components/breadcrumb';
import TextareaArray from 'components/textarea-array';
import CustomFields from 'components/custom-fields';
import AttachmentService from '@/services/attachment';
import AuditService from '@/services/audit';
import DataService from '@/services/data';
import VulnService from '@/services/vulnerability';
import Utils from '@/services/utils';
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import _ from 'lodash';
import settings from '@/boot/settings';
import { socket } from '@/boot/socketio';

export default {
  props: {
    frontEndAuditState: Number,
    parentState: String,
    parentApprovals: Array,
  },
  components: {
    BasicEditor,
    Breadcrumb,
    TextareaArray,
    CustomFields
  },
  setup(props) {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const { proxy } = getCurrentInstance();

    const auditId = ref(route.params.auditId);
    const findingId = ref(route.params.findingId);
    const finding = reactive({});
    const findingOrig = reactive({});
    const selectedTab = ref("definition");
    const proofsTabVisited = ref(false);
    const detailsTabVisited = ref(false);
    const vulnTypes = ref([]);
    const AUDIT_VIEW_STATE = Utils.AUDIT_VIEW_STATE;
    const data = reactive({ isAttachement: true, fId: findingId.value });
    const currentTemplate = reactive({ name: '', file: '', ext: '' });
    const errors = reactive({ name: '', file: '' });
    const files = ref(null);
    const oldPickedFile = ref(null);
    const vulnCategories = ref([]);
    const attachments = ref([]);
    const audit = computed(() => proxy.$parent.$parent.audit);
    const sectionId = ref(null);

    const vulnTypesLang = computed(() => vulnTypes.value.filter(type => type.locale === audit.language));
    const screenshotsSize = computed(() => ((JSON.stringify(uploadedImages.value).length) / 1024).toFixed(2));
    const overrideLeaveCheck = ref(false);
    const transitionEnd = ref(true);
    const fieldHighlighted = ref("");
    const commentTemp = ref(null);
    const replyTemp = ref(null);
    const hoverReply = ref(null);
    const  commentDateOptions = ref({
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
    
    const _listener = (e) => {
      if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
        e.preventDefault();
        if (props.frontEndAuditState === AUDIT_VIEW_STATE.EDIT)
          updateFinding();
      }
    };

    const getVulnTypes = () => {
      DataService.getVulnerabilityTypes()
        .then((data) => {
          vulnTypes.value = data.data.datas;
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const cleanFiles = () => {
      files.value = null;
    };

    const getVulnerabilityCategories = () => {
      DataService.getVulnerabilityCategories()
        .then((data) => {
          vulnCategories.value = data.data.datas;
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const downloadAttachement = (index) => {
      const downloadNotif = Notify.create({
        spinner: QSpinnerGears,
        message: 'Generating the Report',
        color: "blue",
        timeout: 0,
        group: false
      });
      if (finding.externalAttachement[index]) {
        var file = finding.externalAttachement[index];
        var blob = new Blob([Buffer.from(file.value, 'base64')], { type: "application/octet-stream" });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = file.name;
        document.body.appendChild(link);
        link.remove();
        downloadNotif({
          icon: 'done',
          spinner: false,
          message: 'Attachment successfully downloaded',
          color: 'green',
          timeout: 2500
        });
      } else if (finding.attachments[index]) {
        AttachmentService.getAttachment(auditId.value, finding.attachments[index]._id)
          .then((data) => {
            var file = data.data.datas;
            var blob = new Blob([Buffer.from(file.value, 'base64')], { type: "application/octet-stream" });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            downloadNotif({
              icon: 'done',
              spinner: false,
              message: 'Attachment successfully downloaded',
              color: 'green',
              timeout: 2500
            });
          });
      } else {
        printNegativeMessage("No attachment to download");
      }
    };

    const printPositiveMessage = (message) => {
      Notify.create({
        message: t(message),
        type: "positive",
        position: 'top-right',
        iconSize: "64px",
        iconColor: "white",
        timeout: "1000"
      });
    };

    const printNegativeMessage = (message) => {
      Notify.create({
        message: t(message),
        type: "negative",
        position: 'top-right',
        iconSize: "100px",
        iconColor: "white",
        timeout: "5000"
      });
    };

    const deleteAttachement = (index) => {
      AttachmentService.deleteAttachment(auditId.value, finding.attachments[index]._id)
        .then(msg => {
          finding.attachments.splice(index, 1);
          updateFinding();
          printPositiveMessage("Attachment succesfully deleted");
        });
    };

    const updateFiles = (newFiles) => {
      files.value = newFiles;
      const promises = files.value.map((file) => {
        return new Promise((resolve, reject) => {
          const downloadNotif = Notify.create({
            spinner: QSpinnerGears,
            message: 'Uploading ' + file.name,
            color: "blue",
            timeout: 0,
            group: false
          });
          let attachment = {};
          attachment.name = file.name;
          let fileReader = new FileReader();
          fileReader.readAsDataURL(file);
          fileReader.onloadend = (e) => {
            attachment.value = fileReader.result.split(',')[1];
            resolve({ attachment, downloadNotif });
          };
          fileReader.onerror = (e) => {
            reject(e);
          };
        });
      });

      Promise.all(promises).then((results) => {
        results.forEach(({ attachment, downloadNotif }) => {
          finding.attachments.push(attachment);
          downloadNotif({
            icon: 'done',
            spinner: false,
            message: attachment.name + ' successfully uploaded',
            color: 'green',
            timeout: 3000
          });
        });
        updateFinding();
      }).catch((error) => {
        console.error('Error during file upload:', error);
      });

      files.value = null;
    };

    const handleFile = (files) => {
      var file = files[0];
      var fileReader = new FileReader();

      fileReader.onloadend = (e) => {
        currentTemplate.file = fileReader.result.split(",")[1];
      };
      currentTemplate.ext = file.name.split('.').pop();
      fileReader.readAsDataURL(file);
    };

    const getFinding = () => {
      AuditService.getFinding(auditId.value, findingId.value)
        .then((data) => {
          Object.assign(finding, data.data.datas);
          if (finding.customFields && // For retrocompatibility with customField reference instead of object
            finding.customFields.length > 0 &&
            typeof (finding.customFields[0].customField) === 'string')
            finding.customFields = Utils.filterCustomFields('finding', finding.category, props.parentCustomFields, finding.customFields, audit.language);
          if (finding.paragraphs.length > 0 && !finding.request)
            finding.poc = convertParagraphsToHTML(finding.paragraphs);

          nextTick(() => {
            Utils.syncEditors(proxy.$refs);
            Object.assign(findingOrig, _.cloneDeep(finding));
          });
        })
        .catch((err) => {
          if (!err.response)
            console.log(err);
          else if (err.response.status === 403)
            router.push({ name: '403', params: { error: err.response.data.datas } });
          else if (err.response.status === 404)
            router.push({ name: '404', params: { error: err.response.data.datas } });
        });
    };

    const convertParagraphsToHTML = (paragraphs) => {
      var result = "";
      paragraphs.forEach(p => {
        result += `<p>${p.text}</p>`;
        if (p.images.length > 0) {
          p.images.forEach(img => {
            result += `<img src="${img.image}" alt="${img.caption}" />`;
          });
        }
      });
      return result;
    };

    const updateFinding = () => {
      Utils.syncEditors(proxy.$refs);
      nextTick(() => {
        var customFieldsEmpty = proxy.$refs.customfields && proxy.$refs.customfields.requiredFieldsEmpty()
        var defaultFieldsEmpty = proxy.requiredFieldsEmpty()
        if (customFieldsEmpty || defaultFieldsEmpty) {
            Notify.create({
                message: t('msg.fieldRequired'),
                color: 'negative',
                textColor:'white',
                position: 'top-right'
            })
            return
        }
        AuditService.updateFinding(auditId.value, findingId.value, finding)
        .then(() => {
            Object.assign(findingOrig, _.cloneDeep(finding));
            printPositiveMessage(t('msg.findingUpdateOk'));

            //Update finding.attachments with IDs from the response to avoid duplicates
            getFinding();
        })
        .catch((err) => {
            printNegativeMessage(err.response.data.datas);
        });
    });
    }

    const deleteFinding = () => {
      Dialog.create({
        title: t('msg.deleteFindingConfirm'),
        message: t('msg.deleteFindingNotice'),
        ok: { label: t('btn.confirm'), color: 'positive' },
        cancel: { label: t('btn.cancel'), color: 'negative' }
      })
        .onOk(() => {
            AuditService.deleteFinding(auditId.value, findingId.value)
              .then(() => {
                Notify.create({
                  message: t('msg.findingDeleteOk'),
                  color: 'positive',
                  textColor: 'white',
                  position: 'top-right'
                });
                Object.assign(findingOrig, finding);
                var currentIndex = audit.value.findings.findIndex(e => e._id === findingId.value);
                if (audit.value.findings.length === 1)
                  router.push(`/audits/${audit.value._id}/findings/add`);
                else if (currentIndex === audit.value.findings.length - 1)
                  router.push(`/audits/${audit.value._id}/findings/${audit.value.findings[currentIndex - 1]._id}`);
                
                else 
                  router.push(`/audits/${audit.value._id}/findings/${audit.value.findings[currentIndex + 1]._id}`);
                
              })
              .catch((err) => {
                Notify.create({
                  message: err.response.data.datas,
                  color: 'negative',
                  textColor: 'white',
                  position: 'top-right'
                });
              });
        });
    };

    const backupFinding = () => {
      Utils.syncEditors(proxy.$refs);
      VulnService.backupFinding('eng', finding)
        .then((data) => {
          Notify.create({
            message: data.data.datas,
            color: 'positive',
            textColor: 'white',
            position: 'top-right'
          });
        })
        .catch((err) => {
          Notify.create({
            message: err.response.data.datas,
            color: 'negative',
            textColor: 'white',
            position: 'top-right'
          });
        });
    };

    const syncEditors = () => {
        Utils.syncEditors(proxy.$refs);
    };

    const updateOrig = () => {
        if (selectedTab.value === 'proofs' && !proofsTabVisited.value) {
        Utils.syncEditors(proxy.$refs);
        findingOrig.request = finding.request;
        proofsTabVisited.value = true;
      } else if (selectedTab.value === 'details' && !detailsTabVisited.value) {
        Utils.syncEditors(proxy.$refs);
        findingOrig.remediationDetails = finding.remediationDetails;
        findingOrig.issueDetails = finding.issueDetails;
        detailsTabVisited.value = true;
      }
    };
    const toggleSplitView = () =>  {
        proxy.$parent.retestSplitView = !proxy.$parent.retestSplitView
        if (proxy.$parent.retestSplitView) {
            proxy.$parent.retestSplitRatio = 50
            proxy.$parent.retestSplitLimits = [40, 60]
        }
        else {
            proxy.$parent.retestSplitRatio = 100
            proxy.$parent.retestSplitLimits = [100, 100]
        }
    };

    // *** Comments Handling ***

    const toggleCommentView = () => {
        Utils.syncEditors(proxy.$refs)
        proxy.$parent.commentMode = !proxy$parent.commentMode
        if (proxy.$parent.commentMode) {
            proxy.$parent.commentSplitRatio = 80
            proxy.$parent.commentSplitLimits = [80, 80]
        }
        else {
            proxy.$parent.commentSplitRatio = 100
            proxy.$parent.commentSplitLimits = [100, 100]
        }
    };

    const focusComment = (comment) => {
        if (
            (!!proxy.$parent.editComment && proxy.$parent.editComment !== comment._id) || 
            (proxy.$parent.replyingComment && !comment.replyTemp) || 
            (proxy.$parent.focusedComment === comment._id)
        )
            return

        if (comment.findingId && findingId.value !== comment.findingId) {
            proxy.$router.replace({name: 'editFinding', params: {
                auditId: auditId.value, 
                findingId: comment.findingId, 
                comment: comment
            }})
            return
        }

        if (comment.sectionId && sectionId.value !== comment.sectionId) {
            proxy.$router.replace({name: 'editSection', params: {
                auditId: this.auditId, 
                sectionId: comment.sectionId, 
                comment: comment
            }})
            return
        }

        let definitionFields = ["titleField", "typeField", "descriptionField", "observationField", "referencesField"]
        let detailsFields = ["affectedField", "cvssField", "remediationDifficultyField", "priorityField", "remediationField"]

        // Go to definition tab and scrollTo field
        if (selectedTab !== 'definition' && (definitionFields.includes(comment.fieldName) || comment.fieldName.startsWith('field-'))) {
            selectedTab = "definition"
        }
        else if (selectedTab !== 'poc' && comment.fieldName === 'pocField') {
            selectedTab = "proofs"
        }
        else if (selectedTab !== 'details' && detailsFields.includes(comment.fieldName)) {
            selectedTab = "details"
        }
        let checkCount = 0
        const intervalId = setInterval(() => {
            checkCount++
            if (document.getElementById(comment.fieldName)) {
                clearInterval(intervalId)
                this.$nextTick(() => {
                    document.getElementById(comment.fieldName).scrollIntoView({block: "center"})
                })
            }
            else if (checkCount >= 10) {
                clearInterval(intervalId)
            }
        }, 100)

        fieldHighlighted = comment.fieldName
        proxy.$parent.focusedComment = comment._id

    };

    const createComment = (fieldName) => {
        let comment = {
            _id: 42,
            findingId: findingId.value,
            fieldName: fieldName,
            authorId: user.value.id,
            author: {
                firstname: user.value.firstname,
                lastname: user.value.lastname
            },
            text: "" 
        }
        if (proxy.$parent.editComment === 42){
            proxy.$parent.focusedComment = null
            proxy.$parent.audit.comments.pop()
        }
        proxy.fieldHighlighted = fieldName
        proxy.$parent.audit.comments.push(comment)
        proxy.$parent.editComment = 42
        proxy.focusComment(comment)
    };


    const cancelEditComment = (comment) => {
        proxy.$parent.editComment = null
        if (comment._id === 42) {
            proxy.$parent.audit.comments.pop()
            fieldHighlighted = ""
        }
    };

    const deleteComment =  (comment) => {
        AuditService.deleteComment(auditId.value, comment._id)
        .then(() => {
            if (proxy.$parent.focusedComment === comment._id)
                fieldHighlighted = ""
        })
        .catch((err) => {
            Notify.create({
                message: err.response.data.datas,
                color: 'negative',
                textColor:'white',
                position: 'top-right'
            })
        })
    };

    const updateComment = (comment) => {
        if (comment.textTemp)
            comment.text = comment.textTemp
        if (comment.replyTemp){
            comment.replies.push({
                author: user.value.id,
                text: comment.replyTemp
            })
        }
        if (comment._id === 42) { 
            AuditService.createComment(auditId.value, comment)
            .then((res) => {
                let newComment = res.data.datas
                proxy.$parent.editComment = null
                proxy.$parent.focusedComment = newComment._id
            })
            .catch((err) => {
                Notify.create({
                    message: err.response.data.datas,
                    color: 'negative',
                    textColor:'white',
                    position: 'top-right'
                })
            })
        }
        else {
            
            AuditService.updateComment(auditId.value, comment)
            .then(() => {
                proxy.$parent.editComment = null
                proxy.$parent.editReply = null
            })
            .catch((err) => {
                Notify.create({
                    message: err.response.data.datas,
                    color: 'negative',
                    textColor:'white',
                    position: 'top-right'
                })
            })
        }
    };

    const removeReplyFromComment = (reply, comment) => {
        comment.replies = comment.replies.filter(e => e._id !== reply._id)
        updateComment(comment)
    };

    const displayComment = (comment) => {
        let response = true
        if ((proxy.$parent.commentsFilter === 'active' && comment.resolved)|| (proxy.$parent.commentsFilter === 'resolved' && !comment.resolved))
            response = false
        return response
    };

    const numberOfFilteredComments = () => {
        let count = proxy.$parent.audit.comments.length
        if (proxy.$parent.commentsFilter === 'active')
            count = proxy.$parent.audit.comments.filter(e => !e.resolved).length
        else if (proxy.$parent.commentsFilter === 'resolved')
            count = proxy.$parent.audit.comments.filter(e => e.resolved).length
        
        if (count === 1)
            return `${count} ${$t('item')}`
        else
            return `${count} ${$t('items')}`
    };

    const unsavedChanges = () => {
      if (finding.title !== findingOrig.title)
        return true;
      if ((finding.vulnType || findingOrig.vulnType) && finding.vulnType !== findingOrig.vulnType)
        return true;
      if ((finding.issueBackground || findingOrig.issueBackground) && finding.issueBackground !== findingOrig.issueBackground)
        return true;
      if ((finding.CvssScoreAma || findingOrig.CvssScoreAma) && finding.CvssScoreAma !== findingOrig.CvssScoreAma)
        return true;
      if (!_.isEqual(finding.remediationBackground, findingOrig.remediationBackground))
        return true;
      if (!_.isEqual(finding.customFields, findingOrig.customFields))
        return true;
      if ((finding.request || findingOrig.request) && finding.request !== findingOrig.request)
        return true;
      if ((finding.response || findingOrig.response) && finding.response !== findingOrig.response)
        return true;
      if ((finding.cvssv3 || findingOrig.cvssv3) && finding.cvssv3 !== findingOrig.cvssv3)
        return true;
      if ((finding.urgency || findingOrig.urgency) && finding.urgency !== findingOrig.urgency)
        return true;
      if ((finding.severity || findingOrig.severity) && finding.severity !== findingOrig.severity)
        return true;
      if ((finding.remediationDetails || findingOrig.remediationDetails) && finding.remediationDetails !== findingOrig.remediationDetails)
        return true;
      if ((finding.issueDetails || findingOrig.issueDetails) && finding.issueDetails !== findingOrig.issueDetails)
        return true;
      if (finding.status !== findingOrig.status)
        return true;

      return false;
    };

    const displayHighlightWarning = () => {
        if (overrideLeaveCheck)
            return null

        if (!proxy.settings.report.enabled || !proxy.settings.report.public.highlightWarning)
            return null

        var matchString = `(<mark data-color="${proxy.settings.report.public.highlightWarningColor}".+?>.+?)</mark>`
        var regex = new RegExp(matchString)
        var result = ""

        result = regex.exec(finding.description)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Description</b><br/>"+result[1].substring(0,119)+'...' : "<b>Description</b><br/>"+result[1]
        result = regex.exec(finding.observation)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Observation</b><br/>"+result[1].substring(0,119)+'...' : "<b>Observation</b><br/>"+result[1]
        result = regex.exec(finding.poc)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Proofs</b><br/>"+result[1].substring(0,119)+'...' : "<b>Proofs</b><br/>"+result[1]
        result = regex.exec(finding.remediation)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Remediation</b><br/>"+result[1].substring(0,119)+'...' : "<b>Remediation</b><br/>"+result[1]
        

        if (finding.customFields && finding.customFields.length > 0) {
            for (let i in finding.customFields) {
                let field = finding.customFields[i]
                if (field.customField && field.text && field.customField.fieldType === "text") {
                    result = regex.exec(field.text)
                    if (result && result[1])
                        return (result[1].length > 119) ? `<b>${field.customField.label}</b><br/>`+result[1].substring(0,119)+'...' : `<b>${field.customField.label}</b><br/>`+result[1]
                }
            }
        }
        
        return null
    };

    const requiredFieldsEmpty = () => {
        var hasErrors = false

        if (proxy.$refs.titleField) {
            proxy.$refs.titleField.validate()
            hasErrors = hasErrors || proxy.$refs.titleField.hasError
        }
        if (proxy.$refs.typeField) {
            proxy.$refs.typeField.validate()
            hasErrors = hasErrors || proxy.$refs.typeField.hasError
        }
        if (proxy.$refs.descriptionField) {
            proxy.$refs.descriptionField.validate()
            hasErrors = hasErrors || proxy.$refs.descriptionField.hasError
        }
        if (proxy.$refs.observationField) {
            proxy.$refs.observationField.validate()
            hasErrors = hasErrors || proxy.$refs.observationField.hasError
        }
        if (proxy.$refs.referencesField) {
            proxy.$refs.referencesField.validate()
            hasErrors = hasErrors || proxy.$refs.referencesField.hasError
        }
        if (proxy.$refs.pocField) {
            proxy.$refs.pocField.validate()
            hasErrors = hasErrors || proxy.$refs.pocField.hasError
        }
        if (proxy.$refs.affectedField) {
            proxy.$refs.affectedField.validate()
            hasErrors = hasErrors || proxy.$refs.affectedField.hasError
        }
        if (proxy.$refs.remediationDifficultyField) {
            proxy.$refs.remediationDifficultyField.validate()
            hasErrors = hasErrors || proxy.$refs.remediationDifficultyField.hasError
        }
        if (proxy.$refs.priorityField) {
            proxy.$refs.priorityField.validate()
            hasErrors = hasErrors || proxy.$refs.priorityField.hasError
        }
        if (proxy.$refs.remediationField) {
            proxy.$refs.remediationField.validate()
            hasErrors = hasErrors || proxy.$refs.remediationField.hasError
        }

        return hasErrors
    };

    onMounted(() => {
      getFinding();
      getVulnerabilityCategories();
      socket.emit('menu', { menu: 'editFinding', finding: findingId.value, room: auditId.value });
      syncEditors();
      updateOrig();

      // save on ctrl+s
      document.addEventListener('keydown', _listener, false);
      proxy.$parent.focusedComment = null
      if (proxy.$route.params.comment)
          proxy.focusComment(proxy.$route.params.comment)
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', _listener, false);
    });

    watch(() => route.params, (newParams, oldParams) => {
      if (unsavedChanges()) {
        Dialog.create({
          title: t('msg.thereAreUnsavedChanges'),
          message: t('msg.doYouWantToLeave'),
          ok: { label: t('btn.confirm'), color: 'negative' },
          cancel: { label: t('btn.cancel'), color: 'white' }
        })
          .onOk(() => {
            next();
          });
      } else {
        next();
      }

      
    });

    return {
      t,
      auditId,
      findingId,
      finding,
      findingOrig,
      selectedTab,
      proofsTabVisited,
      detailsTabVisited,
      vulnTypes,
      AUDIT_VIEW_STATE,
      data,
      currentTemplate,
      errors,
      files,
      oldPickedFile,
      audit,
      vulnCategories,
      attachments,
      vulnTypesLang,
      screenshotsSize,
      overrideLeaveCheck,
      transitionEnd,
      fieldHighlighted,
      commentTemp,
      replyTemp,
      hoverReply,
      commentDateOptions,
      attachments,
      _listener,
      getVulnTypes,
      cleanFiles,
      getVulnerabilityCategories,
      downloadAttachement,
      printPositiveMessage,
      printNegativeMessage,
      deleteAttachement,
      updateFiles,
      handleFile,
      getFinding,
      convertParagraphsToHTML,
      updateFinding,
      deleteFinding,
      backupFinding,
      syncEditors,
      updateOrig,
      unsavedChanges,
      requiredFieldsEmpty
    };
  }
}