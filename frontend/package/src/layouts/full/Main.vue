<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue';
import { useDisplay } from "vuetify";
import itensNavegacao from '@/dados/itensNavegacao';
import NavGroup from './vertical-sidebar/NavGroup/index.vue';
import NavItem from './vertical-sidebar/NavItem/index.vue';
import Logo from './logo/Logo.vue';
// dropdown imports
import NotificationDD from './vertical-header/NotificationDD.vue';
import ProfileDD from './vertical-header/ProfileDD.vue';
import { Icon } from '@iconify/vue';
const menuLateral = shallowRef(itensNavegacao);
const { mdAndDown } = useDisplay();
const sDrawer = ref(true);
onMounted(() => {
  sDrawer.value = !mdAndDown.value; // hide on mobile, show on desktop
});
watch(mdAndDown, (val) => {
  sDrawer.value = !val;
});
</script>

<template>
    <!------Sidebar-------->
    <v-navigation-drawer left elevation="0"  app class="leftSidebar"  v-model="sDrawer">
        <!---Logo part -->
        <div class="pa-5">
            <Logo />
        </div>
        <!-- ---------------------------------------------- -->
        <!---Navigation -->
        <!-- ---------------------------------------------- -->
        <div>
        <perfect-scrollbar class="scrollnavbar">
            <v-list class="pa-6 pt-0">
                <!---Menu Loop -->
                <template v-for="(item, i) in menuLateral" :key="item.caminho || item.cabecalho || i">
                    <!---Item Sub Header -->
                    <NavGroup v-if="item.cabecalho" :item="{ header: item.cabecalho }" />
                    <!---Single Item-->
                    <NavItem v-else class="leftPadding" :item="{ title: item.titulo, icon: item.icone, to: item.caminho }" />
                    <!---End Single Item-->
                </template>
            </v-list>
        </perfect-scrollbar>
    </div>

    </v-navigation-drawer>
    <!------Header-------->
    <v-app-bar elevation="0" height="70" class="top-header">
        <div class="d-flex align-center justify-space-between w-100">
            <div>
                <v-btn class="hidden-lg-and-up ms-md-3  text-muted" @click="sDrawer = !sDrawer" icon variant="flat"
                    size="small">
                    <Icon icon="solar:hamburger-menu-outline" height="20"></Icon>
                  
                </v-btn>
                <!-- Notification -->
                <NotificationDD />
            </div>
            <div>
                <!-- <v-btn to="/planos-alimentares/novo" class="mr-2 bg-primary text-none">Novo plano</v-btn> -->
                <!-- User Profile -->
                <ProfileDD />
            </div>
        </div>
    </v-app-bar>
</template>
