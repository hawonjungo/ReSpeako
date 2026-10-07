import { useContext, useState } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';
import {
  fetchPronunciationUsage,
  getPronunciationConfig,
  PronunciationError,
  savePronunciationConfig,
} from '../utils/pronunciation';
import formatMessage from '../utils/formatMessage';
import PageContainer from './ui/PageContainer';
import SectionCard from './ui/SectionCard';
import PrimaryButton from './ui/PrimaryButton';
import StatusBanner from './ui/StatusBanner';

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white p-3 text-base outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-950';

export default function Settings() {
  const { language } = useContext(LanguageContext);
  const t = translations[language].settings;
  const errors = translations[language].pronunciation.errors;

  const [endpoint, setEndpoint] = useState(() => getPronunciationConfig().endpoint);
  const [token, setToken] = useState(() => getPronunciationConfig().token);
  const [showToken, setShowToken] = useState(false);
  const [message, setMessage] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    savePronunciationConfig({ endpoint, token });
    setMessage({ type: 'success', text: t.saved });
  };

  const handleTest = async () => {
    savePronunciationConfig({ endpoint, token });
    setTesting(true);
    setMessage(null);
    try {
      const usage = await fetchPronunciationUsage();
      setMessage({
        type: 'success',
        text: formatMessage(t.connected, {
          used: Math.round(usage.usedSeconds / 60),
          limit: Math.round(usage.limitSeconds / 60),
        }),
      });
    } catch (error) {
      const code = error instanceof PronunciationError ? error.code : 'default';
      setMessage({ type: 'error', text: errors[code] || errors.default });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = () => {
    setToken('');
    savePronunciationConfig({ endpoint, token: '' });
    setMessage({ type: 'info', text: t.removed });
  };

  return (
    <PageContainer title={t.pageTitle} description={t.description}>
      <div className="mx-auto max-w-2xl space-y-4">
        <SectionCard>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t.pronunciationTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t.pronunciationDescription}</p>

            <label className="block space-y-1">
              <span className="text-sm font-medium">{t.endpoint}</span>
              <input
                type="url"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://respeako-pronunciation.<you>.workers.dev"
                autoComplete="off"
                spellCheck={false}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">{t.token}</span>
              <div className="flex gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className={inputClass}
                />
                <PrimaryButton variant="secondary" onClick={() => setShowToken((value) => !value)}>
                  {showToken ? t.hide : t.show}
                </PrimaryButton>
              </div>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{t.tokenHint}</span>
            </label>

            {message && <StatusBanner type={message.type} message={message.text} />}

            <div className="flex flex-wrap justify-end gap-2">
              {token && <PrimaryButton variant="ghost" onClick={handleRemove}>{t.remove}</PrimaryButton>}
              <PrimaryButton variant="secondary" onClick={handleTest} disabled={!endpoint || !token || testing}>
                {testing ? t.testing : t.test}
              </PrimaryButton>
              <PrimaryButton onClick={handleSave} disabled={!endpoint}>{t.save}</PrimaryButton>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
