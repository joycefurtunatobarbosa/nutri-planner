<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>
<template>
    <div class="barra-superior w-100 px-6">
        <div class="d-flex align-center ga-2">
            <Icon icon="solar:leaf-linear" height="20" width="20" class="text-primary" />
            <span class="text-body-2 text-medium-emphasis">Cuidado nutricional, mais simples.</span>
        </div>
    </div>
</template>

<style scoped>
.barra-superior {
    display: flex;
    min-height: 42px;
    align-items: center;
    background: #fff;
    border-bottom: 1px solid #e8edf2;
}
</style>
