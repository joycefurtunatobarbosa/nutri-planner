import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/plano-compartilhado',
            component: () => import('@/layouts/blank/BlankLayout.vue'),
            children: [
                {
                    name: 'plano-compartilhado',
                    path: '',
                    component: () => import('@/views/planos/PlanoCompartilhado.vue')
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            component: () => import('@/views/auth/Error.vue')
        },
        MainRoutes,
        AuthRoutes
    ]
});
