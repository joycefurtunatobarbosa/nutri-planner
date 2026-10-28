<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { useRoute } from 'vue-router';
import MainView from './Main.vue';
import Topbar from './Topbar.vue';

const route = useRoute();
const paginaAmpla = computed(() => route.name === 'Criar plano alimentar' || route.name === 'Abrir plano alimentar');
</script>

<template>
    <v-locale-provider>
        <!-- <Topbar/> -->
        <v-app class="bg-surface">
            <MainView />
            <v-main class="mr-md-4">
                <div class="mb-3 hr-layout bg-containerBg">
                    <v-container
                        fluid
                        class="page-wrapper bg-background pt-md-8 rounded-xl"
                        :class="{ 'page-wrapper--plano-amplo': paginaAmpla }"
                    >
                        <div class="maxWidth" :class="{ 'maxWidth--plano-amplo': paginaAmpla }">
                            <RouterView />
                        </div>
                    </v-container>
                </div>
            </v-main>
        </v-app>
    </v-locale-provider>
</template>
