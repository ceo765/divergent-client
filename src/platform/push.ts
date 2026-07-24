export type PushDeviceRegistration = {
  platform: string;
  expoPushToken: string;
  deviceId?: string;
  appVersion?: string;
};

export type PushReminderAction =
  | "default"
  | "open"
  | "done"
  | "snooze"
  | "skip"
  | "open_report";

export type PushReminderResponse = {
  action: PushReminderAction;
  reminderId?: string;
  goalId?: string;
  taskId?: string;
  requiresReport?: boolean;
};

export function isNativePushRegistrationSupported() {
  return false;
}

export async function getNativePushDeviceRegistration(): Promise<PushDeviceRegistration | null> {
  return null;
}

export async function configureNativePushNotifications() {
  return;
}

export function addNativePushResponseListener(
  _listener: (response: PushReminderResponse) => void | Promise<void>
) {
  void _listener;
  return {
    remove() {
      return;
    },
  };
}

export async function getLastNativePushResponse(): Promise<PushReminderResponse | null> {
  return null;
}
