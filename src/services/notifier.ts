import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type ActionPerformed,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { DEFAULT_NOTIFY_SETTINGS, isRoutineDone, useAppStore } from '../store/useAppStore';

/**
 * 通知调度中心
 *
 * 核心思路：不再靠 App 开着时的 setInterval 触发提醒，而是把「未来所有该响的通知」
 * 一次性交给 Android 系统闹钟调度。App 被划掉、手机锁屏、重启之后依然会响。
 * 每次任务 / 例行要点 / 设置变化，都会取消旧的并按最新数据整体重排一遍（简单可靠，不会漏也不会重复）。
 */

const CHANNEL_ID = 'momo-reminders';
const NAG_MAX_TIMES = 4;
const EXACT_ASKED_KEY = 'momo-exact-alarm-asked';

export const isNative = () => Capacitor.isNativePlatform();

// 用字符串稳定地映射成正整数 id（通知 id 必须是 32 位整数）
function hashId(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 2147483646) + 1;
}

function parseTime(value: string | undefined, fallback: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value || fallback) ?? /^(\d{1,2}):(\d{2})$/.exec(fallback)!;
  return { hour: Math.min(23, Number(m[1])), minute: Math.min(59, Number(m[2])) };
}

// ---------------------------------------------------------------------------
// 权限
// ---------------------------------------------------------------------------

export async function isNotificationGranted(): Promise<boolean> {
  if (!isNative()) return 'Notification' in window && Notification.permission === 'granted';
  return (await LocalNotifications.checkPermissions()).display === 'granted';
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'default') {
      return (await Notification.requestPermission()) === 'granted';
    }
    return Notification.permission === 'granted';
  }
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    perm = await LocalNotifications.requestPermissions();
  }
  return perm.display === 'granted';
}

/**
 * Android 12+ 的「精确闹钟」权限。没有它，系统可能把提醒推迟几分钟甚至更久。
 * openSettings = true 时会跳到系统设置页让用户打开（只会在首次 / 手动点击时跳）。
 */
export async function ensureExactAlarm(openSettings: boolean): Promise<boolean> {
  if (!isNative()) return true;
  try {
    const res = await LocalNotifications.checkExactNotificationSetting();
    if (res.exact_alarm === 'granted') return true;
    if (openSettings) await LocalNotifications.changeExactNotificationSetting();
    return false;
  } catch {
    return true; // 旧系统没有这个概念
  }
}

// ---------------------------------------------------------------------------
// 构建通知列表
// ---------------------------------------------------------------------------

function buildNotifications(): LocalNotificationSchema[] {
  const { tasks, routines, settings } = useAppStore.getState();
  const name = settings.companionName || '予宁';
  const now = Date.now();
  const list: LocalNotificationSchema[] = [];

  const base = { channelId: CHANNEL_ID, autoCancel: true };

  // ---- 1) 带截止时间的任务：提前预警 → 到点 → 逾期追提醒 ----
  const leadMs = (settings.remindBeforeMinutes ?? 15) * 60 * 1000;
  const nagMin = settings.overdueNagMinutes ?? DEFAULT_NOTIFY_SETTINGS.overdueNagMinutes;

  for (const t of tasks) {
    if (t.status === 'done' || !t.dueAt) continue;
    const extra = { taskId: t.id };
    const common = { ...base, actionTypeId: 'TASK', extra };

    const leadAt = t.dueAt - leadMs;
    if (leadAt > now + 1000) {
      list.push({
        ...common,
        id: hashId(`task:${t.id}:lead`),
        title: `${name}：${settings.remindBeforeMinutes} 分钟后截止`,
        body: t.note ? `${t.title} — ${t.note}` : t.title,
        schedule: { at: new Date(leadAt), allowWhileIdle: true },
      });
    }

    if (t.dueAt > now + 1000) {
      list.push({
        ...common,
        id: hashId(`task:${t.id}:due`),
        title: `${name}：有件事到点啦！`,
        body: t.note ? `${t.title} — ${t.note}` : t.title,
        schedule: { at: new Date(t.dueAt), allowWhileIdle: true },
      });
    }

    if (nagMin > 0) {
      for (let k = 1; k <= NAG_MAX_TIMES; k++) {
        const at = t.dueAt + k * nagMin * 60 * 1000;
        if (at <= now + 1000) continue;
        list.push({
          ...common,
          id: hashId(`task:${t.id}:nag:${k}`),
          title: `${name}：这件事还没完成哦`,
          body: `「${t.title}」已经逾期 ${k * nagMin} 分钟了`,
          schedule: { at: new Date(at), allowWhileIdle: true },
        });
      }
    }
  }

  // ---- 2) 例行要点：按周期重复 ----
  for (const r of routines) {
    if (r.cadence === 'process') continue;
    // 每日要点必须设了时间才提醒；每周 / 每月默认上午 9 点
    if (r.cadence === 'daily' && !r.time) continue;
    const { hour, minute } = parseTime(r.time, '09:00');

    let on: { weekday?: number; day?: number; hour: number; minute: number };
    if (r.cadence === 'daily') on = { hour, minute };
    else if (r.cadence === 'weekly') on = { weekday: (r.weekday ?? 1) + 1, hour, minute }; // 插件里 1=周日
    else on = { day: 1, hour, minute };

    list.push({
      ...base,
      id: hashId(`routine:${r.id}`),
      title: `${name}：${r.title}`,
      body: r.note || (isRoutineDone(r) ? '这期已经完成过啦，保持住～' : '该做这件小事啦'),
      actionTypeId: 'ROUTINE',
      extra: { routineId: r.id },
      schedule: { on, allowWhileIdle: true },
    });
  }

  // ---- 3) 主动陪伴：早安 / 晚间回顾（重点：不用你来开 App，是她来找你） ----
  const pending = tasks.filter((t) => t.status !== 'done');
  const dueToday = pending
    .filter((t) => t.dueAt && new Date(t.dueAt).toDateString() === new Date().toDateString())
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));

  if (settings.morningCheckin ?? DEFAULT_NOTIFY_SETTINGS.morningCheckin) {
    const { hour, minute } = parseTime(settings.morningTime, DEFAULT_NOTIFY_SETTINGS.morningTime);
    const body = dueToday.length
      ? `今天有 ${dueToday.length} 件有时间的事，最早是「${dueToday[0].title}」。有新想法直接回复就能记下～`
      : pending.length
      ? `还有 ${pending.length} 件待办在等你。想到什么新事情，直接回复就能记下～`
      : '今天打算做点什么？想到就直接回复，我帮你记下～';
    list.push({
      ...base,
      id: hashId('checkin:morning'),
      title: `${name}：早安，今天要做什么呀？`,
      body,
      actionTypeId: 'CHECKIN',
      schedule: { on: { hour, minute }, allowWhileIdle: true },
    });
  }

  if (settings.eveningCheckin ?? DEFAULT_NOTIFY_SETTINGS.eveningCheckin) {
    const { hour, minute } = parseTime(settings.eveningTime, DEFAULT_NOTIFY_SETTINGS.eveningTime);
    const body = pending.length
      ? `还有 ${pending.length} 件没完成。今天有什么事忘了记下来吗？直接回复就行～`
      : '今天的事都做完啦！有什么想留给明天的，直接回复我记下～';
    list.push({
      ...base,
      id: hashId('checkin:evening'),
      title: `${name}：今天过得怎么样？`,
      body,
      actionTypeId: 'CHECKIN',
      schedule: { on: { hour, minute }, allowWhileIdle: true },
    });
  }

  return list;
}

// ---------------------------------------------------------------------------
// 同步：取消所有旧的，按最新数据重排
// ---------------------------------------------------------------------------

let syncing = false;
let syncAgain = false;

export async function syncNotifications(): Promise<void> {
  if (!isNative()) return;
  if (syncing) {
    syncAgain = true;
    return;
  }
  syncing = true;
  try {
    do {
      syncAgain = false;
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') break;

      const pending = await LocalNotifications.getPending();
      const stale = pending.notifications.filter((n) => n.id !== hashId('test'));
      if (stale.length) {
        await LocalNotifications.cancel({
          notifications: stale.map((n) => ({ id: n.id })),
        });
      }
      const list = buildNotifications();
      if (list.length) await LocalNotifications.schedule({ notifications: list });
    } while (syncAgain);
  } catch (err) {
    console.warn('[notifier] sync failed', err);
  } finally {
    syncing = false;
  }
}

/** 设置页的「发送测试通知」：5 秒后响，用来确认权限和通道没问题 */
export async function sendTestNotification(): Promise<void> {
  if (!isNative()) return;
  const name = useAppStore.getState().settings.companionName || '予宁';
  await LocalNotifications.schedule({
    notifications: [
      {
        id: hashId('test'),
        title: `${name}：测试通知`,
        body: '收到这条就说明提醒功能正常啦～你可以现在退到桌面等 5 秒',
        channelId: CHANNEL_ID,
        actionTypeId: 'CHECKIN',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// 通知上的按钮：完成 / 稍后 / 直接输入记事
// ---------------------------------------------------------------------------

function handleAction(ev: ActionPerformed) {
  const { actionId, inputValue, notification } = ev;
  const extra = (notification.extra ?? {}) as { taskId?: string; routineId?: string };
  const store = useAppStore.getState();

  if (actionId === 'done' && extra.taskId) {
    store.setTaskStatus(extra.taskId, 'done');
  } else if (actionId === 'snooze' && extra.taskId) {
    store.snoozeTask(extra.taskId, 30);
  } else if (actionId === 'rdone' && extra.routineId) {
    const r = store.routines.find((x) => x.id === extra.routineId);
    if (r && !isRoutineDone(r)) store.toggleRoutineDone(r.id);
  } else if (actionId === 'capture' && inputValue?.trim()) {
    store.addTask({ title: inputValue.trim() });
  }
}

/**
 * App 启动时调用一次：建通知通道、注册按钮、监听按钮点击、
 * 监听数据变化自动重排、回到前台时刷新一次。返回清理函数。
 */
export async function startNotifier(): Promise<() => void> {
  if (!isNative()) return () => {};

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: '提醒与陪伴',
    description: '任务到期、例行要点、早晚问候',
    importance: 5,
    visibility: 1,
    vibration: true,
  }).catch(() => {});

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'TASK',
        actions: [
          { id: 'done', title: '完成了' },
          { id: 'snooze', title: '30 分钟后再提醒' },
        ],
      },
      {
        id: 'ROUTINE',
        actions: [{ id: 'rdone', title: '做完了' }],
      },
      {
        id: 'CHECKIN',
        actions: [
          {
            id: 'capture',
            title: '记一件事',
            input: true,
            inputButtonTitle: '记下',
            inputPlaceholder: '刚想到什么？',
          },
        ],
      },
    ],
  }).catch(() => {});

  const actionHandle = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    handleAction
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNotifications(), 500);
  };

  const unsubscribe = useAppStore.subscribe((state, prev) => {
    if (
      state.tasks !== prev.tasks ||
      state.routines !== prev.routines ||
      state.settings !== prev.settings
    ) {
      scheduleSync();
    }
  });

  const onVisible = () => {
    if (document.visibilityState === 'visible') scheduleSync();
  };
  document.addEventListener('visibilitychange', onVisible);

  // 首次：申请权限 → 精确闹钟（只在第一次引导跳设置）→ 排程
  const granted = await ensureNotificationPermission();
  if (granted) {
    const asked = localStorage.getItem(EXACT_ASKED_KEY) === '1';
    if (!asked) {
      localStorage.setItem(EXACT_ASKED_KEY, '1');
      await ensureExactAlarm(true);
    }
    await syncNotifications();
  }

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisible);
    void actionHandle.remove();
  };
}
