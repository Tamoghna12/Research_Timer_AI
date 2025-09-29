import React from 'react';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { useDynamicBackground } from '../../hooks/useDynamicBackground';

const BackgroundSettings: React.FC = () => {
  const {
    preferences,
    backgrounds,
    toggleBackgrounds,
    toggleAutoChange,
    setInterval,
    setStaticBackground
  } = useDynamicBackground();

  if (!preferences) {
    return <div className="text-gray-500 dark:text-gray-400">Loading background settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            Dynamic Backgrounds
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Beautiful, changing backgrounds for better focus
          </p>
        </div>
        <Button
          onClick={() => toggleBackgrounds(!preferences.backgroundsEnabled)}
          variant={preferences.backgroundsEnabled ? 'primary' : 'secondary'}
          size="sm"
        >
          {preferences.backgroundsEnabled ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      {preferences.backgroundsEnabled && (
        <>
          {/* Auto-change Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Auto-change Backgrounds
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically rotate through backgrounds
              </p>
            </div>
            <Button
              onClick={() => toggleAutoChange(!preferences.background.autoChange)}
              variant={preferences.background.autoChange ? 'primary' : 'secondary'}
              size="sm"
            >
              {preferences.background.autoChange ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Interval Slider */}
          {preferences.background.autoChange && (
            <Field
              label={`Change interval: ${preferences.background.interval} minutes`}
              htmlFor="interval"
            >
              <input
                id="interval"
                type="range"
                min="5"
                max="60"
                step="5"
                value={preferences.background.interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>5 min</span>
                <span>60 min</span>
              </div>
            </Field>
          )}

          {/* Static Background Selection */}
          {!preferences.background.autoChange && (
            <Field label="Choose Static Background" htmlFor="static-bg">
              <div className="grid grid-cols-2 gap-3">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setStaticBackground(bg.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      preferences.background.staticImage === bg.id
                        ? 'border-blue-600 bg-blue-600/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                    }`}
                    style={{
                      background: bg.gradient,
                      position: 'relative'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
                    <div className="relative z-10">
                      <div className="font-medium text-white text-sm">
                        {bg.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Preview */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Available Backgrounds
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {backgrounds.map((bg) => (
                <div
                  key={bg.id}
                  className="aspect-square rounded-lg"
                  style={{ background: bg.gradient }}
                  title={bg.name}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BackgroundSettings;