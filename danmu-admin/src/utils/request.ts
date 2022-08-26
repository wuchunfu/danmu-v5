import axios, { AxiosInstance } from "axios";
import config from "../config";
import storage from "@/utils/stored-data";
import { getAccessToken } from '@/api/token';

const URL = config.url + "api/";
export const CarouselUrl = URL + "v1/upload/carousel";

const service: AxiosInstance = axios.create({
    baseURL: URL,
    timeout: 5000,
    headers: {},
});

//请求拦截器
service.interceptors.request.use((config) => {
    config.headers = config.headers ? config.headers : {};
    if (!storage.get('admin_access_token')) {
        //如果为刷新token的请求则不拦截
        if (config.url === "v1/user/token/refresh") return config;

        //如果没有accessToken且有refreshTokenoken
        if (storage.get('admin_refresh_token')) {
            return new Promise((resolve, reject) => {
                getAccessToken().then((res) => {
                    const token = res.data.data.token;
                    storage.set("admin_access_token", token, 5);
                    config.headers!['Authorization'] = `Bearer ${token}`;
                    resolve(config)
                })
            })
        }
    } else {
        if (!config.headers["Authorization"]) {
            config.headers.Authorization = `Bearer ${storage.get('admin_access_token')}`;
        }
    }
    return config;
}), (error: any) => {
    return Promise.reject(error);
}


//响应拦截器
service.interceptors.response.use((res) => {
    return res;
}, (error) => {
    // token 过期
    if (error.response.data.code === 4010) {
        return getAccessToken().then((res) => {
            const token = res.data.data.token;
            storage.set("admin_access_token", token, 5);
            error.config.headers.Authorization = `Bearer ${token}`;
            return service(error.config)
        })
    }

    return Promise.reject(error);
});

export default service;