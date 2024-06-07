import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '../../i18n';

import ShortcutButton from './ShortcutButton';

interface Shortcut {
  label: string;
  keys: string[];
}

interface ShortcutCategory {
  shortcutCategoryTitle: string;
  shortcuts: Shortcut[];
}

const enterKey = i18n.t('appShortcutsPrompt.enterKey');
const spaceKey = i18n.t('appShortcutsPrompt.spaceKey');
const ctrlKey = i18n.t('appShortcutsPrompt.ctrlKey');
const shiftKey = i18n.t('appShortcutsPrompt.shiftKey');
const altKey = i18n.t('appShortcutsPrompt.altKey');
const rightArrowKey = i18n.t('appShortcutsPrompt.rightArrowKey');
const leftArrowKey = i18n.t('appShortcutsPrompt.leftArrowKey');
const upArrowKey = i18n.t('appShortcutsPrompt.upArrowKey');
const downArrowKey = i18n.t('appShortcutsPrompt.downArrowKey');
const homeKey = i18n.t('appShortcutsPrompt.homeKey');
const mouseClick = i18n.t('appShortcutsPrompt.mouseClick');
const doubleClick = i18n.t('appShortcutsPrompt.doubleClick');

const shortcutData: ShortcutCategory[] = [
  {
    shortcutCategoryTitle: i18n.t('appShortcutsPrompt.mediaPlayback'),
    shortcuts: [
      {
        label: i18n.t('appShortcutsPrompt.playPause'),
        keys: [spaceKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.toggleMute'),
        keys: [ctrlKey, 'M']
      },
      {
        label: i18n.t('appShortcutsPrompt.nextSong'),
        keys: [ctrlKey, rightArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.prevSong'),
        keys: [ctrlKey, leftArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.tenSecondsForward'),
        keys: [shiftKey, rightArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.tenSecondsBackward'),
        keys: [shiftKey, leftArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.upVolume'),
        keys: [ctrlKey, upArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.downVolume'),
        keys: [ctrlKey, downArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.toggleShuffle'),
        keys: [ctrlKey, 'S']
      },
      {
        label: i18n.t('appShortcutsPrompt.toggleRepeat'),
        keys: [ctrlKey, 'T']
      },
      {
        label: i18n.t('appShortcutsPrompt.toggleFavorite'),
        keys: [ctrlKey, 'H']
      },
      {
        label: i18n.t('appShortcutsPrompt.upPlaybackRate'),
        keys: [ctrlKey, ']']
      },
      {
        label: i18n.t('appShortcutsPrompt.downPlaybackRate'),
        keys: [ctrlKey, '[']
      },
      {
        label: i18n.t('appShortcutsPrompt.resetPlaybackRate'),
        keys: [ctrlKey, '\\']
      }
    ]
  },
  {
    shortcutCategoryTitle: i18n.t('appShortcutsPrompt.navigation'),
    shortcuts: [
      { label: i18n.t('appShortcutsPrompt.goHome'), keys: [altKey, homeKey] },
      {
        label: i18n.t('appShortcutsPrompt.goBack'),
        keys: [altKey, leftArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.goForward'),
        keys: [altKey, rightArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.openMiniPlayer'),
        keys: [ctrlKey, 'N']
      },
      {
        label: i18n.t('appShortcutsPrompt.goToLyrics'),
        keys: [ctrlKey, 'L']
      },
      {
        label: i18n.t('appShortcutsPrompt.goToQueue'),
        keys: [ctrlKey, 'Q']
      },
      {
        label: i18n.t('appShortcutsPrompt.goToSearch'),
        keys: [ctrlKey, 'F']
      }
    ]
  },
  {
    shortcutCategoryTitle: i18n.t('appShortcutsPrompt.selections'),
    shortcuts: [
      {
        label: i18n.t('appShortcutsPrompt.selectMultipleItems'),
        keys: [shiftKey, mouseClick]
      }
    ]
  },
  {
    shortcutCategoryTitle: i18n.t('appShortcutsPrompt.lyrics'),
    shortcuts: [
      {
        label: i18n.t('appShortcutsPrompt.playNextLyricsLine'),
        keys: [altKey, downArrowKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.playPrevLyricsLine'),
        keys: [altKey, upArrowKey]
      }
    ]
  },
  {
    shortcutCategoryTitle: i18n.t('appShortcutsPrompt.lyricsEditor'),
    shortcuts: [
      {
        label: i18n.t('appShortcutsPrompt.selectNextLyricsLine'),
        keys: [enterKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.selectPrevLyricsLine'),
        keys: [shiftKey, enterKey]
      },
      {
        label: i18n.t('appShortcutsPrompt.selectCustomLyricsLine'),
        keys: [doubleClick]
      }
    ]
  },
  {
    shortcutCategoryTitle: i18n.t('appShortcutsPrompt.otherShortcuts'),
    shortcuts: [
      {
        label: i18n.t('appShortcutsPrompt.toggleTheme'),
        keys: [ctrlKey, 'Y']
      },
      {
        label: i18n.t('appShortcutsPrompt.toggleMiniPlayerAlwaysOnTop'),
        keys: [ctrlKey, 'O']
      },
      {
        label: i18n.t('appShortcutsPrompt.reload'),
        keys: [ctrlKey, 'R']
      },
      { label: i18n.t('appShortcutsPrompt.openDevtools'), keys: ['F12'] }
    ]
  }
];

const AppShortcutsPrompt = () => {
  const { t } = useTranslation();

  const shortcutCategoryComponents = useMemo(
    () =>
      shortcutData.map((category, categoryIndex) => {
        const { shortcutCategoryTitle, shortcuts } = category;

        const shortcutComponents = shortcuts.map((shortcut, i) => {
          const { label, keys } = shortcut;

          const shortcutKeyComponents = keys.map((key, index) => (
            <>
              {/*  eslint-disable-next-line react/no-array-index-key */}
              <ShortcutButton shortcutKey={key} key={index} />
              {index !== keys.length - 1 && <span className="mx-2 text-font-color-dimmed">+</span>}
            </>
          ));

          return (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="shortcut mb-4 flex w-[45%] items-center justify-between p-2"
            >
              <div className="shortcut-label opacity-75">{label}</div>
              <div className="shortcut-keys flex items-center">{shortcutKeyComponents}</div>
            </div>
          );
        });

        return (
          // eslint-disable-next-line react/no-array-index-key
          <li key={categoryIndex} className="shortcut-category mt-8">
            <div className="shortcut-category-title text-2xl text-font-color-highlight dark:text-dark-font-color-highlight">
              {shortcutCategoryTitle}
            </div>
            <div className="shortcuts-container ml-4 flex flex-row flex-wrap justify-between">
              {shortcutComponents}
            </div>
          </li>
        );
      }),
    []
  );
  return (
    <div>
      <div className="title-container text-center text-3xl font-medium">
        {t('appShortcutsPrompt.inAppShortcuts')}
      </div>
      <ul className="shortcuts-categories-container px-4">{shortcutCategoryComponents}</ul>
    </div>
  );
};

export default AppShortcutsPrompt;
