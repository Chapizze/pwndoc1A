import findingNumberCharts from 'components/stats/findingNumber';
import findingSeverityCharts from 'components/stats/findingSeverity'
import { ref, onMounted, watch} from 'vue';
import { useI18n } from 'vue-i18n';
import StatsService from '@/services/stats';


export default {
    setup () {
        const { t } = useI18n();
        const findingNumber = ref([]);
        const findingNumberChart = ref(null);
        const findingsByCategory = ref(null);
        const findingsBySeverity = ref(null);
        const selectedYear = ref(new Date().getFullYear())

        onMounted(async () => {
            
            await getFindingsByCategory();
            await getFindingsBySeverity(selectedYear.value);
        });

        const getFindingsByCategory = async () => {
            const req = await StatsService.getFindingsByCategory();
            findingsByCategory.value = req.data.datas 
        }

        const getFindingsBySeverity = async (year) => {
            const request = await StatsService.getFindingsBySeverity(year);
            findingsBySeverity.value = request.data.datas       
        }

       const onYearChange = async (newYear) => {
            selectedYear.value = newYear
            await getFindingsBySeverity(selectedYear.value)      
        }


        return {
            findingNumber,
            findingNumberChart,
            t,
            findingsBySeverity,
            findingsByCategory,
            getFindingsBySeverity,
            getFindingsByCategory,
            onYearChange,
            selectedYear,

        }

    },
    components: {
        findingNumberCharts,
        findingSeverityCharts
    }

}