import { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import storage from '../../../utils/localStorage';
import Button from '../../Button';
import SensitiveActionConfirmPrompt from '../../SensitiveActionConfirmPrompt';
import ShortcutButton from '../ShortcutButton';

const KeyboardShortcutsSettings = () => {
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = useState(
    storage.keyboardShortcuts.getKeyboardShortcuts()
  );
  const [newShortcut, setNewShortcut] = useState<Shortcut | null>(null);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [hasDuplicate, setHasDuplicate] = useState(false);
  const { changePromptMenuData, addNewNotifications } = useContext(AppUpdateContext);

  useEffect(() => {
    if (!editingShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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

      const original = shortcuts
        .flatMap((category) => category.shortcuts)
        .find((shortcut) => shortcut.id === editingShortcut);
      setNewShortcut({ id: editingShortcut, label: original?.label ?? editingShortcut, keys });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingShortcut, shortcuts]);

  useEffect(() => {
    if (!editingShortcut) return;

    const handleClickOutside = (e: MouseEvent) => {
      const shortcutElements = document.querySelectorAll('.shortcut.editing');
      const clickedOutside = Array.from(shortcutElements).every((el) => !el.contains(e.target as Node));

      const sortKeys = (k: string[]) => [...k].sort();
      const duplicate =
        newKeys.length > 0 &&
        shortcuts.some((category) =>
          category.shortcuts.some(
            (shortcut) =>
              shortcut.id !== editingShortcut &&
              JSON.stringify(sortKeys(shortcut.keys)) === JSON.stringify(sortKeys(newKeys))
          )
        );

      setHasDuplicate(duplicate);

      if (duplicate && newKeys.length > 0) {
        addNewNotifications([
          {
            id: 'duplicateShortcut',
            content: t('keyboardShortcutsSettings.duplicateShortcut')
          }
        ]);
        return;
      }

      if (clickedOutside) {
        if (newShortcut && !duplicate) {
          storage.keyboardShortcuts.setKeyboardShortcuts(newShortcut.id, newShortcut.keys);
          setShortcuts(storage.keyboardShortcuts.getKeyboardShortcuts());
        }
        setEditingShortcut(null);
        setHasDuplicate(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingShortcut, newShortcut, newKeys, shortcuts, addNewNotifications, t]);

  const shortcutCategoryComponents = useMemo(
    () =>
      shortcuts.map((category, categoryIndex) => (
        <li key={categoryIndex} className="shortcut-category mt-6">
          <div className="shortcut-category-title text-font-color-highlight dark:text-dark-font-color-highlight mb-2 text-lg font-medium">
            {category.shortcutCategoryTitle}
          </div>
          <div className="shortcuts-container ml-2 flex flex-row flex-wrap justify-between">
            {category.shortcuts.map((shortcut, shortcutIndex) => {
              const isEditing = editingShortcut === shortcut.id;

              return (
                <div
                  key={shortcutIndex}
                  className={`shortcut mb-2 flex w-full items-center justify-between rounded-md p-2 sm:w-[48%] ${
                    isEditing
                      ? `editing bg-dark-background-color-3/75 dark:bg-dark-background-color-3/15${
                          hasDuplicate ? ' bg-font-color-crimson dark:bg-font-color-crimson' : ''
                        }`
                      : ''
                  }`}
                >
                  <div className="shortcut-label text-sm opacity-75">{shortcut.label}</div>
                  <div className="shortcut-keys flex items-center">
                    {isEditing ? (
                      <div className="flex items-center">
                        {newKeys.map((key, i) => (
                          <Fragment key={i}>
                            <ShortcutButton shortcutKey={key} />
                            {i !== newKeys.length - 1 && <span className="mx-1 text-xs">+</span>}
                          </Fragment>
                        ))}
                        {!newKeys.length && (
                          <span className="text-font-color-dimmed text-xs">
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
                              <span className="text-font-color-dimmed mx-1 text-xs">+</span>
                            )}
                          </Fragment>
                        ))}
                        <Button
                          className="m-0 ml-2 p-1.5"
                          clickHandler={() => {
                            setEditingShortcut(shortcut.id);
                            setNewKeys(shortcut.keys);
                          }}
                          isDisabled={!!editingShortcut}
                          iconName="edit"
                          iconClassName="material-icons-round-outlined text-sm"
                          tooltipLabel={t('keyboardShortcutsSettings.editShortcut')}
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
    [shortcuts, editingShortcut, newKeys, t, hasDuplicate]
  );

  return (
    <li
      className="main-container keyboard-shortcuts-settings-container mb-16"
      id="keyboard-shortcuts-settings-container"
    >
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2 leading-none">keyboard</span>
        {t('keyboardShortcutsSettings.title')}
      </div>
      <div className="description mb-4 pl-6 text-sm opacity-70">
        {t('keyboardShortcutsSettings.description')}
      </div>
      <ul className="pl-6">{shortcutCategoryComponents}</ul>
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
                    addNewNotifications([
                      {
                        id: 'shortcutsReset',
                        content: t('keyboardShortcutsSettings.resetSuccess')
                      }
                    ]);
                    setShortcuts(storage.keyboardShortcuts.getKeyboardShortcuts());
                    changePromptMenuData(false);
                  }
                }}
              />
            );
          }}
        />
      </div>
    </li>
  );
};

export default KeyboardShortcutsSettings;
