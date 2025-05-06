import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import log from '../utils/log';
import BugImg from '../assets/images/svg/Bug Fixed_Monochromatic.svg';
import Button from './Button';

const { isInDevelopment } = window.api.properties;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryStates {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorBoundaryFallbackUi = (props: ErrorBoundaryStates) => {
  const { t } = useTranslation();
  const { error, errorInfo } = props;

  return (
    <div className="text-font-color-black dark:text-font-color-white flex h-full w-full flex-col items-center justify-center overflow-x-hidden">
      <img src={BugImg} alt="App bug found." className="w-48" />
      <br />
      <h2>{t('common.somethingWentWrong')}</h2>
      {isInDevelopment && (
        <details
          style={{ whiteSpace: 'pre-wrap' }}
          className="mx-auto max-w-[80%] text-sm font-light"
        >
          <summary className="cursor-pointer px-4 py-2 underline">{t('common.details')}</summary>
          <p className="bg-background-color-2 dark:bg-dark-background-color-2 mt-4 rounded-2xl p-4">
            {error && error.toString()}
            <br />
            {errorInfo?.componentStack}
          </p>
        </details>
      )}
      <div className="buttons-container">
        <Button
          className="bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 mt-4 mr-0! text-sm"
          label={t('common.restartApp')}
          iconName="restart_alt"
          clickHandler={() => window.api.appControls.restartRenderer('error')}
        />
      </div>
    </div>
  );
};

// Error Boundary is written in Class Component because React Error boundaries currently only support on Class Components.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryStates> {
  constructor(props: ErrorBoundaryProps | Readonly<ErrorBoundaryProps>) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error,
      errorInfo
    });
    // You can also log error messages to an error reporting service here
    log(error, undefined, 'ERROR');
  }

  render() {
    if (this.state.errorInfo)
      return <ErrorBoundaryFallbackUi error={this.state.error} errorInfo={this.state.errorInfo} />;
    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;
