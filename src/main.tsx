import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';

// Service Worker 只给浏览器/PWA 用：原生 App 里资源由 APK 直接提供，
// 再叠一层 SW 缓存会让升级后的界面有概率被旧缓存顶住（缓存名还是写死的 v1）
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
