<template>
    <q-card class="col-md-6 col-12">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-h6 col-grow">Findings Overview</div>
        </div>
  
        <apexchart 
          height="350" 
          :options="chartOptions" 
          :series="chartSeries"
        ></apexchart>
      </q-card-section>
    </q-card>
  </template>
  
  <script>
  import { ref, onMounted, computed, watch } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import DataService from '@/services/data'
  
  export default {
    props: {
      modelValue: {
        type: Object,
        required: true
      },
  
    },
    components: {
      apexchart: VueApexCharts
    },
    setup(props) {
      // Reactive variables for findings and categories
      const allFindings = ref([])
      const categories = ref([])
  
      const xaxis = ref([])
      const yaxis = ref([])
  
      const data = ref([])
  
      // Chart data preparation
      const chartSeries = ref([])
  
      const chartOptions = ref({
        chart: {
          type: 'bar',
          height: 500,
          toolbar: { show: false }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '50%',
            borderRadius: 5,
            borderRadiusApplication: 'end'
          }
        },
        dataLabels: { enabled: true },
        stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
        },
        xaxis: {
          categories: [],
          title: { text: 'Finding Categories' },
          labels: {
            rotate: -35,
            style: {
              fontSize: '11px'
            }
          }
        },
        yaxis: {
          title: { text: 'Number of Findings' }
        },
        colors: [],
        tooltip: {
          y: {
            formatter: function (val) {
              return val + " findings"
            }
          }
        },
        legend: {
          show: true
        }
      })
  
      watch(() => props.modelValue, (newValue) => {
        if (newValue) {
          newValue.forEach((allFindings) => {
              chartSeries.value.push(allFindings)
          })
        }
      }, { immediate: true })
  
      // Initial chart data load
      onMounted(async () => {
        try {
          const req = await DataService.getVulnerabilityCategories()
          
          // Explicitly convert to array of names
          categories.value = req.data.datas.map(category => category.name)
          
          // Force a chart update by creating a new options object
          chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
              categories: [...categories.value],
              title: { text: 'Finding Categories' }
            }
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error)
        }
      })
  
      return {
        chartSeries,
        chartOptions,
        categories
      }
    }
  }
  </script>