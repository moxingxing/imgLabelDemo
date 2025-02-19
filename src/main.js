/*
 * @Description: 
 * @Autor: lin
 * @Date: 2024-05-11 11:09:39
 * @LastEditors: lin
 * @LastEditTime: 2025-02-19 15:05:55
 */
import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';

Vue.use(ElementUI);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
