import findingNumberCharts from 'components/stats/findingNumber';
import { ref, onMounted} from 'vue';
import { useI18n } from 'vue-i18n';
import StatsService from '@/services/stats';


export default {
    setup () {
        const { t } = useI18n();
        const findingNumber = ref([]);
        const findingNumberChart = ref(null);
        const data = ref(null);

        onMounted(async () => {
            const req = await StatsService.getFindingByCategory();
            data.value = req.data.datas 
        });


        return {
            findingNumber,
            findingNumberChart,
            t,
            data
        }

    },
    components: {
        findingNumberCharts
    }

}