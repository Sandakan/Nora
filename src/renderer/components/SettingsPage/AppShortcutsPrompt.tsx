import React from 'react';

interface Shortcut {
  label: string;
  keys: string[];
}

interface ShortcutCategory {
  shortcutCategoryTitle: string;
  shortcuts: Shortcut[];
}

const shortcutData: ShortcutCategory[] = [
  {
    shortcutCategoryTitle: 'Media Playback',
    shortcuts: [
      { label: 'Play / Pause', keys: ['Space'] },
      { label: 'Toggle Mute', keys: ['Ctrl', 'M'] },
      { label: 'Next Song', keys: ['Ctrl', 'Right Arrow'] },
      { label: 'Previous Song', keys: ['Ctrl', 'Left Arrow'] },
      { label: '10 Seconds Forward', keys: ['Shift', 'Right Arrow'] },
      { label: '10 Seconds Backward', keys: ['Shift', 'Left Arrow'] },
      { label: 'Increase Volume', keys: ['Ctrl', 'Up Arrow'] },
      { label: 'Decrease Volume', keys: ['Ctrl', 'Down Arrow'] },
      { label: 'Toggle Queue Shuffle', keys: ['Ctrl', 'S'] },
      { label: 'Toggle Queue Repeat', keys: ['Ctrl', 'T'] },
      { label: 'Toggle Favorite', keys: ['Ctrl', 'H'] },
      { label: 'Increase Playback Rate By 0.05x', keys: ['Ctrl', ']'] },
      { label: 'Decrease Playback Rate By 0.05x', keys: ['Ctrl', '['] },
      { label: 'Reset Playback Rate to 1x', keys: ['Ctrl', '\\'] },
    ],
  },
  {
    shortcutCategoryTitle: 'Navigation',
    shortcuts: [
      { label: 'Go to Home', keys: ['Alt', 'Home'] },
      { label: 'Go Back', keys: ['Alt', 'Left Arrow'] },
      { label: 'Go Forward', keys: ['Alt', 'Right Arrow'] },
      { label: 'Open Mini Player', keys: ['Ctrl', 'N'] },
      { label: 'Go to Lyrics', keys: ['Ctrl', 'L'] },
      { label: 'Go to Current Queue', keys: ['Ctrl', 'Q'] },
      { label: 'Go to Search', keys: ['Ctrl', 'F'] },
    ],
  },
  {
    shortcutCategoryTitle: 'Selections',
    shortcuts: [
      { label: 'Select Multiple Items', keys: ['Shift', 'Mouse Click'] },
    ],
  },
  {
    shortcutCategoryTitle: 'Other Shortcuts',
    shortcuts: [
      { label: 'Toggle App Theme', keys: ['Ctrl', 'Y'] },
      // { label: 'Toggle Mini Player Always On Top', keys: ['Ctrl', 'O'] },
      { label: 'Reload', keys: ['Ctrl', 'R'] },
      { label: 'Open Devtools', keys: ['F12'] },
    ],
  },
];

const AppShortcutsPrompt = () => {
  const shortcutCategoryComponents = React.useMemo(
    () =>
      shortcutData.map((category) => {
        const { shortcutCategoryTitle, shortcuts } = category;

        const shortcutComponents = shortcuts.map((shortcut) => {
          const { label, keys } = shortcut;

          const shortcutKeyComponents = keys.map((key) => (
            <div className="shortcut-button mr-2 rounded-md bg-background-color-3/75 px-2 py-1 text-center dark:bg-dark-background-color-3/25">
              {key}
            </div>
          ));

          return (
            <div className="shortcut mb-4 flex w-[45%] items-center justify-between p-2">
              <div className="shortcut-label opacity-75">{label}</div>
              <div className="shortcut-keys flex">{shortcutKeyComponents}</div>
            </div>
          );
        });

        return (
          <li className="shortcut-category mt-8">
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
        In App Shortcuts
      </div>
      <ul className="shortcuts-categories-container px-4">
        {shortcutCategoryComponents}
      </ul>
    </div>
  );
};

export default AppShortcutsPrompt;
