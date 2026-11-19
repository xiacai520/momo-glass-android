import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppStore } from '../store/useAppStore';

export function useTaskMonitor() {
  const [now, setNow] = useState(() => Date.now());
  const tasks = useAppStore((s) => s.tasks);
  const settings = useAppStore((s) => s.settings);
  const markTaskNotified = useAppStore((s) => s.markTaskNotified);
  const showToast = useAppStore((s) => s.showToast);
  const setMood = useAppStore((s) => s.setMood);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.checkPermissions().then((res) => {
        if (res.display !== 'granted') {
          LocalNotifications.requestPermissions().catch(() => {});
        }
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);

      const leadMs = settings.remindBeforeMinutes * 60 * 1000;
      let hasUrgent = false;

      tasks.forEach(async (task) => {
        if (task.status === 'done' || !task.dueAt) return;
        const remaining = task.dueAt - current;

        if (remaining <= leadMs) {
          hasUrgent = true;
          if (!task.notified) {
            markTaskNotified(task.id);
            const isOverdue = remaining <= 0;
            const title = isOverdue
              ? `${settings.companionName}：有件事到点啦！`
              : `${settings.companionName}：还有 ${Math.max(1, Math.ceil(remaining / 60000))} 分钟截止`;
            const body = task.note ? `${task.title} — ${task.note}` : task.title;

            showToast({
              title,
              subtitle: task.title,
              type: 'urgent',
            });

            if (Capacitor.isNativePlatform()) {
              try {
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      id: Math.floor(Math.random() * 2147483647),
                      title,
                      body,
                      schedule: { at: new Date(Date.now() + 200) },
                    },
                  ],
                });
              } catch {
                // ignore permission errors
              }
            } else if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, { body, tag: task.id });
            }
          }
        }
      });

      if (hasUrgent) {
        setMood('urgent');
      } else if (useAppStore.getState().mood === 'urgent') {
        // 临期任务都处理完后把心情切回来，否则头像会一直挂在「临期提醒」状态
        setMood('idle');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tasks, settings, markTaskNotified, showToast, setMood]);

  return now;
}
