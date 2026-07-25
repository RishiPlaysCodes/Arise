// ============================================================================
// NOTIFICATIONS SERVICE - Local, offline scheduled reminders
//
// All notifications are scheduled locally on-device (no push server needed),
// so they work fully offline. Battery-friendly: uses the OS alarm scheduler
// rather than any background polling loop.
// ============================================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  async init() {
    if (!Device.isDevice) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('quests', {
        name: 'Daily Quests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7c3aed',
      });
      await Notifications.setNotificationChannelAsync('punishment', {
        name: 'System Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400],
        lightColor: '#ef4444',
      });
    }
    return status === 'granted';
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Schedule the recurring daily reminders (morning quest, midday, evening warning)
  async scheduleDailyReminders() {
    await this.cancelAll();

    const schedule = async (hour, minute, title, body, channelId = 'quests') => {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, ...(Platform.OS === 'android' ? { channelId } : {}) },
        trigger: { hour, minute, repeats: true },
      });
    };

    await schedule(8, 0, 'New Quests Await, Hunter', 'Your daily quests have arrived. Rise and conquer.');
    await schedule(14, 0, 'Progress Check', 'How are your quests going? Keep moving toward your goal.');
    await schedule(20, 0, 'System Warning', 'Complete 70% of your quests before midnight or face punishment.', 'punishment');
    await schedule(22, 30, 'Final Warning', 'Time is running out. The System is watching.', 'punishment');
  },

  async notifyNow(title, body, isPunishment = false) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title, body, sound: true,
        ...(Platform.OS === 'android' ? { channelId: isPunishment ? 'punishment' : 'quests' } : {}),
      },
      trigger: null, // immediate
    });
  },

  async notifyLevelUp(level, rank) {
    await this.notifyNow('LEVEL UP!', `You reached Level ${level} — ${rank}-Rank. Your power grows.`);
  },

  async notifyPunishment(message) {
    await this.notifyNow('PUNISHMENT ACTIVATED', message, true);
  },
};

export default NotificationService;
