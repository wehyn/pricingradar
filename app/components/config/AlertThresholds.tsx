'use client';

import { useState } from 'react';
import { AlertThreshold, AlertCondition } from '@/lib/scrapers/types';
import { DEFAULT_ALERT_PRESETS, generateId } from '@/lib/scrapers';
import { Button, Input, Card } from '../ui';

interface AlertThresholdsProps {
  alerts: AlertThreshold[];
  onAlertsChange: (alerts: AlertThreshold[]) => void;
}

const ALERT_CONDITIONS: { value: AlertCondition; label: string; description: string; hasValue: boolean }[] = [
  { value: 'price_drop_percentage', label: 'Price drops by %', description: 'Alert when price decreases by percentage', hasValue: true },
  { value: 'price_drop_absolute', label: 'Price drops by amount', description: 'Alert when price decreases by fixed amount', hasValue: true },
  { value: 'price_increase_percentage', label: 'Price increases by %', description: 'Alert when price increases by percentage', hasValue: true },
  { value: 'price_increase_absolute', label: 'Price increases by amount', description: 'Alert when price increases by fixed amount', hasValue: true },
  { value: 'price_below', label: 'Price falls below', description: 'Alert when price goes below threshold', hasValue: true },
  { value: 'price_above', label: 'Price rises above', description: 'Alert when price exceeds threshold', hasValue: true },
  { value: 'out_of_stock', label: 'Out of stock', description: 'Alert when product becomes unavailable', hasValue: false },
  { value: 'back_in_stock', label: 'Back in stock', description: 'Alert when product becomes available again', hasValue: false },
];

export function AlertThresholds({ alerts, onAlertsChange }: AlertThresholdsProps) {
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<AlertThreshold>>({
    condition: 'price_drop_percentage',
    value: 10,
    enabled: true,
    notifyEmail: true,
  });

  const handleToggleAlert = (id: string) => {
    onAlertsChange(
      alerts.map(alert => 
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const handleRemoveAlert = (id: string) => {
    onAlertsChange(alerts.filter(alert => alert.id !== id));
  };

  const handleAddAlert = () => {
    if (!newAlert.condition) return;
    
    const conditionConfig = ALERT_CONDITIONS.find(c => c.value === newAlert.condition);
    
    const alert: AlertThreshold = {
      id: generateId(),
      name: newAlert.name || conditionConfig?.label || 'Custom Alert',
      condition: newAlert.condition,
      value: newAlert.value || 0,
      enabled: true,
      notifyEmail: newAlert.notifyEmail,
      notifySlack: newAlert.notifySlack,
    };
    
    onAlertsChange([...alerts, alert]);
    setNewAlert({
      condition: 'price_drop_percentage',
      value: 10,
      enabled: true,
      notifyEmail: true,
    });
    setShowAddAlert(false);
  };

  const handleUsePresets = () => {
    const presetAlerts = DEFAULT_ALERT_PRESETS.map(preset => ({
      ...preset,
      id: generateId(),
    }));
    onAlertsChange(presetAlerts);
  };

  const getConditionLabel = (condition: AlertCondition) => {
    return ALERT_CONDITIONS.find(c => c.value === condition)?.label || condition;
  };

  const formatAlertValue = (alert: AlertThreshold) => {
    if (alert.condition === 'out_of_stock' || alert.condition === 'back_in_stock') {
      return '';
    }
    if (alert.condition.includes('percentage')) {
      return `${alert.value}%`;
    }
    return `$${alert.value}`;
  };

  const selectedCondition = ALERT_CONDITIONS.find(c => c.value === newAlert.condition);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Alert Thresholds
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Set up alerts to notify you when competitor prices change
        </p>
      </div>

      {/* Quick Setup */}
      {alerts.length === 0 && (
        <Card variant="outline" padding="md" className="text-center">
          <div className="text-4xl mb-3">🔔</div>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">No alerts configured</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
            Start with recommended presets or create custom alerts
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleUsePresets}>
              Use Recommended Presets
            </Button>
            <Button variant="outline" onClick={() => setShowAddAlert(true)}>
              Create Custom
            </Button>
          </div>
        </Card>
      )}

      {/* Alert List */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                flex items-center gap-4 p-4 rounded-lg border transition-all
                ${alert.enabled 
                  ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700' 
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 opacity-60'
                }
              `}
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggleAlert(alert.id)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${alert.enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${alert.enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>

              {/* Alert Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {alert.name}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {getConditionLabel(alert.condition)} {formatAlertValue(alert)}
                </div>
              </div>

              {/* Notification Icons */}
              <div className="flex gap-2 text-zinc-400">
                {alert.notifyEmail && (
                  <span title="Email notification">📧</span>
                )}
                {alert.notifySlack && (
                  <span title="Slack notification">💬</span>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemoveAlert(alert.id)}
                className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Alert Form */}
      {alerts.length > 0 && !showAddAlert && (
        <Button variant="outline" onClick={() => setShowAddAlert(true)} className="w-full">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Alert
        </Button>
      )}

      {showAddAlert && (
        <Card variant="outline" padding="md">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">New Alert</h4>
          <div className="space-y-4">
            <Input
              label="Alert Name (optional)"
              value={newAlert.name || ''}
              onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
              placeholder="e.g., Major price drop alert"
            />
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Condition
              </label>
              <select
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as AlertCondition })}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 
                  bg-white dark:bg-zinc-900 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {ALERT_CONDITIONS.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              {selectedCondition && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {selectedCondition.description}
                </p>
              )}
            </div>

            {selectedCondition?.hasValue && (
              <Input
                label={newAlert.condition?.includes('percentage') ? 'Percentage (%)' : 'Amount'}
                type="number"
                value={newAlert.value?.toString() || ''}
                onChange={(e) => setNewAlert({ ...newAlert, value: parseFloat(e.target.value) || 0 })}
                placeholder={newAlert.condition?.includes('percentage') ? 'e.g., 10' : 'e.g., 5.00'}
              />
            )}

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAlert.notifyEmail}
                  onChange={(e) => setNewAlert({ ...newAlert, notifyEmail: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAlert.notifySlack}
                  onChange={(e) => setNewAlert({ ...newAlert, notifySlack: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Slack</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAlert}>Add Alert</Button>
              <Button variant="ghost" onClick={() => setShowAddAlert(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

