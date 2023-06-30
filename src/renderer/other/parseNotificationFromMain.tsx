import Img from 'renderer/components/Img';

interface AppNotificationConfig extends Partial<AppNotification> {
  // to prevent having an empty array of triggers
  trigger: [MessageCodes, ...MessageCodes[]];
  iconName?: string;
  iconClassName?: string;
  /** `validate` runs after the trigger to check whether this notification is applicable by returning a boolean. */
  validate?: (obj: {
    data?: Record<string, unknown>;
    message: string;
    messageCode: MessageCodes;
  }) => boolean;
  /** Use `this` keyword to update object data. */
  update?: (obj: {
    data?: Record<string, unknown>;
    message: string;
    messageCode: MessageCodes;
  }) => AppNotificationConfig;
}

const defaultButtonStyles =
  '!bg-background-color-3 dark:!bg-dark-background-color-3 !text-font-color-black dark:!text-font-color-black !font-light';

const notificationsFromMainConfig: AppNotificationConfig[] = [
  {
    trigger: ['SUCCESS'],
    iconName: 'done',
  },
  {
    trigger: ['FAILURE'],
    iconName: 'error',
    iconClassName: 'material-icons-round-outlined',
  },
  {
    trigger: ['LOADING'],
    iconName: 'downloading',
    iconClassName: 'material-icons-round-outlined',
  },
  {
    trigger: ['INFO'],
    iconName: 'info',
    iconClassName: 'material-icons-round-outlined',
  },
  {
    trigger: ['APP_THEME_CHANGE'],
    iconName: 'brightness_4',
  },
  {
    trigger: ['PARSE_SUCCESSFUL'],
    iconName: 'file_download',
    iconClassName: 'material-icons-round-outlined',
    update({ data }) {
      if (data) this.id ??= data?.songId as string | undefined;
      return this;
    },
  },
  {
    trigger: ['RESYNC_SUCCESSFUL'],
    iconName: 'check',
    iconClassName: 'material-icons-round-outlined',
  },
  {
    trigger: ['PARSE_FAILED'],
    delay: 15000,
    buttons: [
      {
        label: 'Resync Songs',
        iconClassName: 'sync',
        className: defaultButtonStyles,
        clickHandler: () =>
          window.api.audioLibraryControls.resyncSongsLibrary(),
      },
    ],
  },
  {
    trigger: ['PLAYBACK_FROM_UNKNOWN_SOURCE'],
    delay: 15000,
    iconName: 'error',
    iconClassName: 'material-icons-round-outlined',
    validate({ data }) {
      if (data) return data && 'path' in data;
      return false;
    },
  },
  {
    trigger: ['SONG_LIKE', 'SONG_DISLIKE'],
    validate({ data }) {
      if (data) return 'artworkPath' in data;
      return false;
    },
    update({ data, messageCode }) {
      this.icon = (
        <div className="relative h-8 w-8">
          <Img
            className="aspect-square h-full w-full rounded-sm"
            src={`nora://localFiles/${data?.artworkPath as string}`}
            loading="eager"
            alt="song artwork"
          />
          <span
            className={`material-icons-round${
              messageCode === 'SONG_DISLIKE' ? '-outlined' : ''
            } icon absolute -bottom-1 -right-1 text-font-color-crimson dark:text-font-color-crimson`}
          >
            favorite
          </span>
        </div>
      );
      return this;
    },
  },
  {
    trigger: ['SONG_REMOVE_PROCESS_UPDATE', 'AUDIO_PARSING_PROCESS_UPDATE'],
    delay: 10000,
    iconClassName: 'material-icons-round-outlined',
    type: 'WITH_PROGRESS_BAR',
    validate({ data }) {
      if (data) return 'max' in data && 'value' in data;
      return false;
    },
    update({ data, messageCode }) {
      this.progressBarData = {
        max: (data?.max as number) || 0,
        value: (data?.value as number) || 0,
      };
      this.iconName =
        messageCode === 'AUDIO_PARSING_PROCESS_UPDATE' ? 'add' : 'delete';

      return this;
    },
  },
  {
    trigger: [
      'SONG_PALETTE_GENERAING_PROCESS_UPDATE',
      'GENRE_PALETTE_GENERAING_PROCESS_UPDATE',
    ],
    delay: 10000,
    iconName: 'magic_button',
    iconClassName: 'material-icons-round-outlined',
    type: 'WITH_PROGRESS_BAR',
    validate({ data }) {
      if (data) return 'max' in data && 'value' in data;
      return false;
    },
    update({ data }) {
      this.progressBarData = {
        max: (data?.max as number) || 0,
        value: (data?.value as number) || 0,
      };

      return this;
    },
  },
];

const parseNotificationFromMain = (
  message: string,
  messageCode: MessageCodes = 'INFO',
  data?: Record<string, unknown>
) => {
  const notificationData: AppNotification = {
    buttons: [],
    content: <div>{message}</div>,
    id: messageCode,
    type: 'DEFAULT',
  };

  if (messageCode) {
    const obj = { message, messageCode, data };

    for (const config of notificationsFromMainConfig) {
      const { trigger, validate = () => true, update } = config;
      const validateFunc = validate.bind(config);

      if (trigger.includes(messageCode) && validateFunc(obj)) {
        let configData = config;
        if (update) configData = update.bind(configData, obj)();

        const {
          id,
          delay,
          buttons,
          progressBarData,
          type,
          content: notificationContent,
          order,
          icon,
          iconName,
          iconClassName,
        } = configData;

        if (id) notificationData.id = id;
        if (delay) notificationData.delay = delay;
        if (buttons) notificationData.buttons = buttons;
        if (type) notificationData.type = type;
        if (order) notificationData.order = order;
        if (notificationContent) notificationData.content = notificationContent;
        if (progressBarData) notificationData.progressBarData = progressBarData;

        if (icon) notificationData.icon = icon;
        if (iconName) notificationData.iconName = iconName;
        if (iconClassName) notificationData.iconClassName = iconClassName;

        break;
      }
    }
  }

  return notificationData;
};

export default parseNotificationFromMain;
