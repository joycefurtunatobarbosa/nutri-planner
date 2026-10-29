<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const identificador = ref('');
const senha = ref('');

function fazerLogin() {
    void router.push('/planos-alimentares');
}
</script>

<template>
    <v-form class="d-flex flex-column" @submit.prevent="fazerLogin">
        <v-col cols="12">
            <v-label class="font-weight-bold mb-1">E-mail ou usuário</v-label>
            <v-text-field
                v-model="identificador"
                variant="outlined"
                density="compact"
                autocomplete="username"
                hide-details
                color="primary"
            />
        </v-col>
        <v-col cols="12">
            <v-label class="font-weight-bold mb-1">Senha</v-label>
            <v-text-field
                v-model="senha"
                variant="outlined"
                density="compact"
                type="password"
                autocomplete="current-password"
                hide-details
                color="primary"
            />
        </v-col>
        <v-col cols="12">
            <v-btn type="submit" color="primary" size="large" block flat>Entrar</v-btn>
        </v-col>
    </v-form>
</template>
