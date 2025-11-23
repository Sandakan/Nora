import { useCallback, type ReactNode } from 'react';
import { dispatch, store } from '../store/store';

/**
 * Return type for the usePromptMenu hook
 */
export interface UsePromptMenuReturn {
  /**
   * Change the prompt menu data (show/hide prompts, navigate history)
   *
   * @param isVisible - Whether the prompt menu should be visible
   * @param prompt - The prompt content to display (ReactNode) or null to clear all prompts
   * @param className - Optional CSS class name for the prompt
   *
   * @example
   * ```tsx
   * // Show a new prompt
   * changePromptMenuData(true, <MyPromptComponent />, 'custom-class');
   *
   * // Hide current prompt
   * changePromptMenuData(false);
   *
   * // Clear all prompts
   * changePromptMenuData(false, null);
   * ```
   */
  changePromptMenuData: (
    isVisible?: boolean,
    prompt?: ReactNode | null,
    className?: string
  ) => void;

  /**
   * Update the prompt menu history index (navigate back/forward in prompt history)
   *
   * @param type - The type of navigation:
   *   - 'increment': Move forward in history
   *   - 'decrement': Move back in history
   *   - 'home': Return to the first prompt
   *
   * @example
   * ```tsx
   * // Go back to previous prompt
   * updatePromptMenuHistoryIndex('decrement');
   *
   * // Go forward to next prompt
   * updatePromptMenuHistoryIndex('increment');
   *
   * // Return to first prompt
   * updatePromptMenuHistoryIndex('home');
   * ```
   */
  updatePromptMenuHistoryIndex: (type: 'increment' | 'decrement' | 'home') => void;
}

/**
 * Hook for managing prompt menu state and navigation
 *
 * Provides functions to show/hide prompt menus, add prompts to history,
 * and navigate through prompt history (back/forward/home).
 *
 * The prompt menu is used for displaying modal dialogs, error messages,
 * confirmation prompts, and other overlay content.
 *
 * @returns Object containing prompt menu management functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { changePromptMenuData, updatePromptMenuHistoryIndex } = usePromptMenu();
 *
 *   const showError = () => {
 *     changePromptMenuData(
 *       true,
 *       <ErrorPrompt message="Something went wrong!" />,
 *       'error-prompt'
 *     );
 *   };
 *
 *   const goBack = () => {
 *     updatePromptMenuHistoryIndex('decrement');
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={showError}>Show Error</button>
 *       <button onClick={goBack}>Go Back</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePromptMenu(): UsePromptMenuReturn {
  const changePromptMenuData = useCallback(
    (isVisible = false, prompt?: ReactNode | null, className = '') => {
      const promptData: PromptMenuData = { prompt, className };

      const data = {
        isVisible,
        currentActiveIndex:
          prompt && isVisible
            ? store.state.promptMenuNavigationData.prompts.length
            : prompt === null && isVisible === false
              ? 0
              : store.state.promptMenuNavigationData.currentActiveIndex,
        prompts:
          prompt && isVisible
            ? store.state.promptMenuNavigationData.prompts.concat(promptData)
            : prompt === null && isVisible === false
              ? []
              : store.state.promptMenuNavigationData.prompts
      };

      dispatch({ type: 'PROMPT_MENU_DATA_CHANGE', data });
    },
    []
  );

  const updatePromptMenuHistoryIndex = useCallback((type: 'increment' | 'decrement' | 'home') => {
    const { prompts, currentActiveIndex } = store.state.promptMenuNavigationData;
    if (type === 'decrement' && currentActiveIndex - 1 >= 0) {
      const updatedData = {
        isVisible: store.state.promptMenuNavigationData.isVisible,
        currentActiveIndex: currentActiveIndex - 1,
        prompts: store.state.promptMenuNavigationData.prompts
      };
      dispatch({
        type: 'PROMPT_MENU_DATA_CHANGE',
        data: updatedData
      });
    }
    if (type === 'increment' && currentActiveIndex + 1 < prompts.length) {
      const updatedData = {
        isVisible: store.state.promptMenuNavigationData.isVisible,
        currentActiveIndex: currentActiveIndex + 1,
        prompts: store.state.promptMenuNavigationData.prompts
      };
      dispatch({
        type: 'PROMPT_MENU_DATA_CHANGE',
        data: updatedData
      });
    }
    return undefined;
  }, []);

  return {
    changePromptMenuData,
    updatePromptMenuHistoryIndex
  };
}
