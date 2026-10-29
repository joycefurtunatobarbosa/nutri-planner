import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            name: 'Landing page',
            path: '/',
            component: () => import('@/views/LandingPage.vue'),
            meta: {
                requiresAuth: false
            }
        },
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
        MainRoutes,
        AuthRoutes,
        {
            path: '/:pathMatch(.*)*',
            component: () => import('@/views/auth/Error.vue')
        }
    ]
});
