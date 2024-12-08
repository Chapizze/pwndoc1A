<template>
    <q-card class="col-md-6 col-12">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-h6 col-grow">Findings Severity</div>
        </div>
        <apexchart 
          height="455" 
          :options="chartOptions" 
          :series="chartSeries"
        ></apexchart>
        <div class="row items-center q-mt-md">
          <div class="col-auto">
            <q-select 
              v-model="selectedYear" 
              :options="yearOptions" 
              label="Select Year" 
              outlined 
              dense
              class="year-select"
              @update:model-value="$emit('year-change', $event)"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </template>
  
  <script>
  import { ref, watch, computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  
  export default {
    props: {
      modelValue: {
        type: Array,
        default: () => []
      }
    },
    emits: ['year-change'],
    components: {
      apexchart: VueApexCharts
    },
    setup(props) {
      // Reactive series to track changes
      const chartSeries = ref(props.modelValue)

      const yearOptions = computed(() => {
            const currentYear = new Date().getFullYear()
            return Array.from({length: 3}, (_, i) => currentYear - i)
      })

      const selectedYear = ref(new Date().getFullYear())

      // Severity labels (matching the expected order of API response)
      const severityLabels = ['Critical', 'High', 'Medium', 'Low']
  
      // Chart options with comprehensive configuration
      const chartOptions = {
        chart: {
          width: 455,
          type: 'donut',
        },
        labels: severityLabels,
        plotOptions: {
          pie: {
            startAngle: -90,
            endAngle: 270,
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total Findings',
                  formatter: function (w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val.toFixed(1) + '%'
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            shadeIntensity: 0.5,
            gradientToColors: [
            '#000000',  // Lighter Critical Black
            '#FF6347',  // Lighter High Red
            '#FFA500',  // Lighter Medium Orange
            '#20B2AA'   // Lighter Low Green
            ],
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 0.7,
            stops: [0, 100]
          }
        },
        colors: [
          '#000000',  // Critical - Black
          '#FF0000',  // High - Red
          '#FFA500',  // Medium - Orange
          '#00FF00'   // Low - Green
        ],
        legend: {
          position: 'right',
          offsetY: 0
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      };


      // Watch for changes in modelValue and update chartSeries
      watch(() => props.modelValue, (newValue) => {
        chartSeries.value = newValue
      }, { immediate: true })
  
      return {
        chartSeries,
        chartOptions,
        yearOptions,
        selectedYear
      }
    }
  }
  </script>

<style scoped>
.year-select {
  min-width: 120px; /* Adjust this value based on the length of the label */
}
</style>