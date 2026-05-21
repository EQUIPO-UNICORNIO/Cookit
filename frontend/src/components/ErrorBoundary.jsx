import React from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    const { t } = this.props;
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-page flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{t('errorBoundary.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/access'; }}
              className="bg-primary-600 text-white font-bold rounded-xl px-6 py-3 text-sm"
            >
              {t('errorBoundary.retry')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundaryInner);
