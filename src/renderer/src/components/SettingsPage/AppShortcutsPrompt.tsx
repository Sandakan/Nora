import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import storage from '../../utils/localStorage';
import Button from '../Button';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import ShortcutButton from './ShortcutButton';

const AppShortcutsPrompt = () => {
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = React.useState(
    storage.keyboardShortcuts.getKeyboardShortcuts()
  );
  const [newShortcut, setNewShortcut] = useState<Shortcut | null>(null);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [editingShortcut, setEditingShortcut] = React.useState<string | null>(null);
  const { changePromptMenuData, addNewNotifications } = React.useContext(AppUpdateContext);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingShortcut) return;

      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.metaKey) keys.push('Cmd');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      const key = e.key;
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        keys.push(key === ' ' ? 'Space' : key);
      }

      setNewKeys(keys);
      setNewShortcut({ id: editingShortcut, label: editingShortcut, keys });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingShortcut]);

  useEffect(() => {
    if (!editingShortcut) return;

    const handleClickOutside = (e: MouseEvent) => {
      const shortcutElements = document.querySelectorAll('.shortcut.editing');
      const clickedOutside = Array.from(shortcutElements).every(
        (el) => !el.contains(e.target as Node)
      );

      const sortKeys = (k: string[]) => [...k].sort();
      const duplicate = shortcuts.some((category) =>
        category.shortcuts.some(
          (shortcut) =>
            shortcut.id !== editingShortcut &&
            JSON.stringify(sortKeys(shortcut.keys)) === JSON.stringify(sortKeys(newKeys))
        )
      );

      const editingElement = document.querySelector(`.shortcut.editing`);

      if (duplicate && newKeys.length > 0) {
        editingElement?.classList.add('bg-font-color-crimson', 'dark:bg-font-color-crimson');
        addNewNotifications([
          {
            id: 'duplicateShortcut',
            content: t('keyboardShortcutsSettings.duplicateShortcut')
          }
        ]);
        return;
      } else {
        editingElement?.classList.remove('bg-font-color-crimson', 'dark:bg-font-color-crimson');
      }

      if (clickedOutside) {
        if (newShortcut && !duplicate) {
          storage.keyboardShortcuts.setKeyboardShortcuts(newShortcut.id, newShortcut.keys);
          setShortcuts(storage.keyboardShortcuts.getKeyboardShortcuts());
        }
        setEditingShortcut(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingShortcut, newShortcut, newKeys, addNewNotifications, shortcuts, t]);

  const shortcutCategoryComponents = useMemo(
    () =>
      shortcuts.map((category, categoryIndex) => (
        <li key={categoryIndex} className="shortcut-category mt-8">
          <div className="shortcut-category-title text-font-color-highlight dark:text-dark-font-color-highlight text-2xl">
            {category.shortcutCategoryTitle}
          </div>
          <div className="shortcuts-container ml-4 flex flex-row flex-wrap justify-between">
            {category.shortcuts.map((shortcut, shortcutIndex) => {
              const isEditing = editingShortcut === shortcut.id;

              return (
                <div
                  key={shortcutIndex}
                  className={`shortcut mb-4 flex w-[45%] items-center justify-between p-2 ${
                    isEditing
                      ? 'editing bg-dark-background-color-3/75 dark:bg-dark-background-color-3/15 rounded-md'
                      : ''
                  }`}
                >
                  <div className="shortcut-label opacity-75">{shortcut.label}</div>
                  <div className="shortcut-keys flex items-center">
                    {isEditing ? (
                      <div className="flex items-center">
                        {newKeys.map((key, i) => (
                          <Fragment key={i}>
                            <ShortcutButton shortcutKey={key} />
                            {i !== newKeys.length - 1 && <span className="mx-2">+</span>}
                          </Fragment>
                        ))}
                        {!newKeys.length && (
                          <span className="text-font-color-dimmed">
                            {t('keyboardShortcutsSettings.pressNewShortcut')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {shortcut.keys.map((key, i) => (
                          <Fragment key={i}>
                            <ShortcutButton shortcutKey={key} />
                            {i !== shortcut.keys.length - 1 && (
                              <span className="text-font-color-dimmed mx-2">+</span>
                            )}
                          </Fragment>
                        ))}
                        <Button
                          className="m-0 ml-4 p-2"
                          clickHandler={() => {
                            setEditingShortcut(shortcut.id);
                            setNewKeys(shortcut.keys);
                          }}
                          isDisabled={!!editingShortcut}
                          iconName="edit"
                          iconClassName="material-icons-round-outlined"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </li>
      )),
    [shortcuts, editingShortcut, newKeys, t]
  );

  return (
    <div>
      <div className="title-container text-center text-3xl font-medium">
        {t('appShortcutsPrompt.inAppShortcuts')}
      </div>
      {editingShortcut && (
        <div className="instruction-text text-font-color-dimmed px-4 text-center text-sm">
          {t('keyboardShortcutsSettings.editShortcut')}
        </div>
      )}
      <ul className="shortcuts-categories-container px-4">{shortcutCategoryComponents}</ul>
      <div className="mt-4 flex justify-center">
        <Button
          label={t('keyboardShortcutsSettings.resetToDefaults')}
          iconName="refresh"
          className="button-label-text"
          clickHandler={() => {
            changePromptMenuData(
              true,
              <SensitiveActionConfirmPrompt
                title={t('keyboardShortcutsSettings.resetConfirmTitle')}
                content={
                  <div>{t('keyboardShortcutsSettings.resetConfirmContent')}</div>
                }
                confirmButton={{
                  label: t('keyboardShortcutsSettings.resetToDefaults'),
                  clickHandler: () => {
                    storage.keyboardShortcuts.resetShortcutsToDefaults();
                    setShortcuts(storage.keyboardShortcuts.getKeyboardShortcuts());
                    addNewNotifications([
                      {
                        id: 'shortcutsReset',
                        content: t('keyboardShortcutsSettings.resetSuccess')
                      }
                    ]);
                    changePromptMenuData(false);
                  }
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
};

export default AppShortcutsPrompt;
