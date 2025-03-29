import i18n from '../i18n';

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
    trigger: [
      'SUCCESS',
      'RESYNC_SUCCESSFUL',
      'RESET_SUCCESSFUL',
      'PENDING_METADATA_UPDATES_SAVED',
      'LASTFM_LOGIN_SUCCESS',
      'SONG_BLACKLISTED',
      'ARTWORK_SAVED',
      'FOLDER_PARSED_FOR_DIRECTORIES',
      'LYRICS_SAVE_QUEUED',
      'LYRICS_SAVED_IN_LRC_FILE',
      'PENDING_LYRICS_SAVED',
      'ADDED_SONGS_TO_PLAYLIST',
      'APPDATA_EXPORT_SUCCESS',
      'APPDATA_IMPORT_SUCCESS',
      'APPDATA_IMPORT_SUCCESS_WITH_PENDING_RESTART',
      'PLAYLIST_EXPORT_SUCCESS',
      'PLAYLIST_IMPORT_SUCCESS',
      'PLAYLIST_RENAME_SUCCESS',
      'SONG_REPARSE_SUCCESS'
    ],
    iconName: 'done'
  },
  {
    trigger: [
      'FAILURE',
      'RESET_FAILED',
      'OPEN_SONG_IN_EXPLORER_FAILED',
      'METADATA_UPDATE_FAILED',
      'LYRICS_FIND_FAILED',
      'ARTWORK_SAVE_FAILED',
      'APPDATA_EXPORT_FAILED',
      'APPDATA_IMPORT_FAILED',
      'APPDATA_IMPORT_FAILED_DUE_TO_MISSING_FILES',
      'PLAYLIST_EXPORT_FAILED',
      'PLAYLIST_IMPORT_FAILED',
      'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_DATA',
      'PLAYLIST_IMPORT_FAILED_DUE_TO_INVALID_FILE_EXTENSION',
      'PLAYLIST_IMPORT_FAILED_DUE_TO_SONGS_OUTSIDE_LIBRARY',
      'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST_FAILED',
      'PLAYLIST_CREATION_FAILED',
      'SONG_REPARSE_FAILED'
    ],
    iconName: 'error',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: ['LOADING'],
    iconName: 'downloading',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: ['LYRICS_TRANSLATION_SUCCESS', 'LYRICS_TRANSLATION_FAILED'],
    iconName: 'translate',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: [
      'INFO',
      'SONG_EXT_NOT_SUPPORTED_FOR_LYRICS_SAVES',
      'WHITELISTING_FOLDER_FAILED_DUE_TO_BLACKLISTED_PARENT_FOLDER',
      'WHITELISTING_SONG_FAILED_DUE_TO_BLACKLISTED_DIRECTORY',
      'NO_MORE_GENRE_PALETTES',
      'NO_MORE_SONG_PALETTES',
      'PLAYLIST_IMPORT_TO_EXISTING_PLAYLIST',
      'PLAYLIST_NOT_FOUND',
      'LYRICS_TRANSLATION_TO_SAME_SOURCE_LANGUAGE'
    ],
    iconName: 'info',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: ['DESTINATION_NOT_SELECTED'],
    iconName: 'wrong_location',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: ['APP_THEME_CHANGE'],
    iconName: 'brightness_4'
  },
  {
    trigger: ['APPDATA_IMPORT_STARTED'],
    iconName: 'download'
  },
  {
    trigger: ['MUSIC_FOLDER_DELETED', 'EMPTY_MUSIC_FOLDER_DELETED', 'SONG_DELETED'],
    iconName: 'delete',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: ['PARSE_SUCCESSFUL'],
    iconName: 'file_download',
    iconClassName: 'material-icons-round-outlined',
    update({ data }) {
      if (data) this.id ??= data?.songId as string | undefined;
      return this;
    }
  },
  {
    trigger: ['RESYNC_SUCCESSFUL'],
    iconName: 'check',
    iconClassName: 'material-icons-round-outlined'
  },
  {
    trigger: ['PARSE_FAILED'],
    duration: 15000,
    buttons: [
      {
        label: i18n.t('settingsPage.resyncLibrary'),
        iconClassName: 'sync',
        className: defaultButtonStyles,
        clickHandler: () => window.api.audioLibraryControls.resyncSongsLibrary()
      }
    ]
  },
  {
    trigger: ['PLAYBACK_FROM_UNKNOWN_SOURCE'],
    duration: 15000,
    iconName: 'error',
    iconClassName: 'material-icons-round-outlined',
    validate({ data }) {
      if (data) return data && 'path' in data;
      return false;
    }
  },
  {
    trigger: ['ARTIST_LIKE', 'ARTIST_DISLIKE'],
    iconName: 'favorite',
    update({ messageCode }) {
      this.iconClassName =
        messageCode === 'ARTIST_DISLIKE'
          ? 'material-icons-round-outlined text-font-color-crimson dark:text-font-color-crimson'
          : '';

      return this;
    }
  },
  {
    trigger: ['SONG_LIKE', 'SONG_DISLIKE'],
    iconName: 'favorite',
    validate({ data }) {
      if (data) return 'artworkPath' in data;
      return false;
    },
    update({ messageCode }) {
      this.iconClassName =
        messageCode === 'SONG_DISLIKE'
          ? 'material-icons-round-outlined text-font-color-crimson dark:text-font-color-crimson'
          : '';
      return this;
    }
  },
  {
    trigger: ['SONG_REMOVE_PROCESS_UPDATE', 'AUDIO_PARSING_PROCESS_UPDATE'],
    duration: 10000,
    iconClassName: 'material-icons-round-outlined',
    type: 'WITH_PROGRESS_BAR',
    validate({ data }) {
      if (data) return 'total' in data && 'value' in data;
      return false;
    },
    update({ data, messageCode }) {
      this.progressBarData = {
        total: (data?.total as number) || 0,
        value: (data?.value as number) || 0
      };
      this.iconName = messageCode === 'AUDIO_PARSING_PROCESS_UPDATE' ? 'add' : 'delete';

      return this;
    }
  },
  {
    trigger: ['APPDATA_EXPORT_STARTED'],
    iconName: 'publish',
    duration: 10000,
    iconClassName: 'material-icons-round-outlined',
    type: 'WITH_PROGRESS_BAR',
    validate({ data }) {
      if (data) return 'total' in data && 'value' in data;
      return false;
    },
    update({ data }) {
      this.progressBarData = {
        total: (data?.total as number) || 0,
        value: (data?.value as number) || 0
      };

      return this;
    }
  },
  {
    trigger: ['SONG_PALETTE_GENERATING_PROCESS_UPDATE', 'GENRE_PALETTE_GENERATING_PROCESS_UPDATE'],
    duration: 10000,
    iconName: 'magic_button',
    iconClassName: 'material-icons-round-outlined',
    type: 'WITH_PROGRESS_BAR',
    validate({ data }) {
      if (data) return 'total' in data && 'value' in data;
      return false;
    },
    update({ data }) {
      this.progressBarData = {
        total: (data?.total as number) || 0,
        value: (data?.value as number) || 0
      };

      if (
        this.progressBarData &&
        this.progressBarData.total !== 0 &&
        this.progressBarData.total === this.progressBarData.value
      )
        this.duration = 5000;
      return this;
    }
  }
];

const parseNotificationFromMain = (
  messageCode: MessageCodes = 'INFO',
  data?: Record<string, unknown>
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageKey: any = `backend.${messageCode}`;

  const message = i18n.exists(messageKey)
    ? (i18n.t(messageKey, data) as string | undefined) || messageCode
    : messageCode;

  const notificationData: AppNotification = {
    buttons: [],
    content: message,
    id: messageCode,
    type: 'DEFAULT'
  };

  if (messageCode) {
    const obj = { message, messageCode, data };

    for (const config of notificationsFromMainConfig) {
      const { trigger, validate = () => true, update } = config;

      if (trigger.includes(messageCode)) {
        const validateFunc = validate.bind(config);

        if (validateFunc(obj)) {
          let configData = config;
          if (update) configData = update.bind(configData, obj)();

          const {
            id,
            duration,
            buttons,
            progressBarData,
            type,
            content: notificationContent,
            order,
            icon,
            iconName,
            iconClassName
          } = configData;

          if (id) notificationData.id = id;
          if (duration) notificationData.duration = duration;
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
  }

  return notificationData;
};

export default parseNotificationFromMain;
