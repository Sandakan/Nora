import ReleaseNotesPrompt from '../components/ReleaseNotesPrompt/ReleaseNotesPrompt';
import { dispatch, store } from '../store/store';

export function openReleaseNotesPrompt(): void {
  const promptData: PromptMenuData = {
    prompt: <ReleaseNotesPrompt />,
    className: 'release-notes px-8 py-4'
  };

  const data = {
    isVisible: true,
    currentActiveIndex: store.state.promptMenuNavigationData.prompts.length,
    prompts: store.state.promptMenuNavigationData.prompts.concat(promptData)
  };

  dispatch({ type: 'PROMPT_MENU_DATA_CHANGE', data });
}

export default openReleaseNotesPrompt;
