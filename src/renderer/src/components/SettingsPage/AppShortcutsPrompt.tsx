import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ShortcutButton from './ShortcutButton';
import { getShortcuts, resetShortcutsToDefaults, updateShortcutKeys, type Shortcut } from '@renderer/other/appShortcuts';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import Button from '../Button';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

const AppShortcutsPrompt = () => {
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = React.useState(getShortcuts());
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
      if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
        keys.push(key === ' ' ? 'Space' : key);
      }
  
      const new_shortcut: Shortcut = {
        label: editingShortcut,
        keys: keys
      };
  
      setNewKeys(keys);
      setNewShortcut(new_shortcut);
  
      setShortcuts((prevShortcuts) => 
        prevShortcuts.map(category => ({
          ...category,
          shortcuts: category.shortcuts.map(shortcut =>
            shortcut.label === new_shortcut.label
              ? { ...shortcut, keys: new_shortcut.keys }
              : shortcut
          )
        }))
      );
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingShortcut]);
  
  useEffect(() => {
    if (!editingShortcut) return;
  
    const handleClickOutside = (e) => {
      const shortcutElements = document.querySelectorAll('.shortcut.editing');
      const clickedOutside = Array.from(shortcutElements).every(
        el => !el.contains(e.target)
      );

      const allShortcuts = getShortcuts().flatMap(category => category.shortcuts);
      const duplicate = allShortcuts.some(shortcut =>
        shortcut.label !== editingShortcut &&
        JSON.stringify(shortcut.keys) === JSON.stringify(newKeys)
      );
  
      const editingElement = document.querySelector(`.shortcut.editing`);
  
      if (duplicate && newKeys.length > 0) {
        editingElement?.classList.add('bg-font-color-crimson', 'dark:bg-font-color-crimson');
        addNewNotifications([{
          id: 'duplicateShortcut',
          content: 'This key combination is already in use',
        }]);
        return;
      } else {
        editingElement?.classList.remove('bg-red-200', 'dark:bg-red-800');
      }
  
      if (clickedOutside) {
        if (newShortcut && !duplicate) {
          updateShortcutKeys(newShortcut.label, newShortcut.keys);
          setShortcuts(getShortcuts());
        }
        setEditingShortcut(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingShortcut, newShortcut, newKeys, addNewNotifications]);


  const shortcutCategoryComponents = useMemo(
    () =>
      shortcuts.map((category, categoryIndex) => (
        <li key={categoryIndex} className="shortcut-category mt-8">
          <div className="shortcut-category-title text-2xl text-font-color-highlight dark:text-dark-font-color-highlight">
            {category.shortcutCategoryTitle}
          </div>
          <div className="shortcuts-container ml-4 flex flex-row flex-wrap justify-between">
            {category.shortcuts.map((shortcut, shortcutIndex) => {
              const isEditing = editingShortcut === shortcut.label;
              // const elementId = `${categoryIndex}-${shortcutIndex}`;

              return (
                <div
                  key={shortcutIndex}
                  className={`shortcut mb-4 flex w-[45%] items-center justify-between p-2 ${
                    isEditing && editingShortcut === shortcut.label ? 'editing bg-dark-background-color-3/75 dark:bg-dark-background-color-3/15 rounded-md' : ''
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
                            {"Press New Shortcut"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {shortcut.keys.map((key, i) => (
                          <Fragment key={i}>
                            <ShortcutButton shortcutKey={key} />
                            {i !== shortcut.keys.length - 1 && (
                              <span className="mx-2 text-font-color-dimmed">+</span>
                            )}
                          </Fragment>
                        ))}
                        <button
                          onClick={() => {
                            setEditingShortcut(shortcut.label);
                            setNewKeys(shortcut.keys);
                          }}
                          className="ml-2 p-1 hover:bg-background-color-3/75 dark:hover:bg-dark-background-color-3/25 rounded"
                          disabled={!!editingShortcut}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M13.5 5.5L15 4L16.5 5.5L20 2L22 4L18.5 7.5L20 9L18.5 10.5L13.5 5.5Z" />
                            <path d="M13.5 5.5L4 15L3 21L9 20L18.5 10.5L13.5 5.5Z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </li>
      )),
    [shortcuts, editingShortcut, newKeys]
  );

  return (
    <div>
      <div className="title-container text-center text-3xl font-medium">
        {t('appShortcutsPrompt.inAppShortcuts')}
      </div>
      {editingShortcut && (
        <div className="instruction-text px-4 text-center text-sm text-font-color-dimmed">
          {"Edit your shortcut"}
        </div>
      )}
      <ul className="shortcuts-categories-container px-4">{shortcutCategoryComponents}</ul>
      <div className="flex justify-center mt-4">
      <Button
        label="RESET"
        iconName="refresh"
        className="button-label-text"
        clickHandler={() => {
          changePromptMenuData(
            true,
            <SensitiveActionConfirmPrompt
              title="Confirm Shortcut Reset"
              content={<div>Are you sure you want to reset all shortcuts to their default settings?</div>}
              confirmButton={{
                label: "RESET",
                clickHandler: () => {
                  resetShortcutsToDefaults();
                  addNewNotifications([
                    {
                      id: 'shortcutsReset',
                      content: <span>All shortcuts have been successfully reset.</span>
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