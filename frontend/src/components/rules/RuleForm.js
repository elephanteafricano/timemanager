import { useEffect, useState } from 'react';
import { applyFieldChange } from '../../utils/forms';

const DEFAULT_FORM_STATE = {
  name: '',
  team_id: '',
  work_start_time: '09:00',
  work_end_time: '17:00',
  start_grace_minutes: '15',
  end_grace_minutes: '0',
  standard_work_hours: '8',
  max_shift_hours: '12',
};

function normalizeTimeValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 5);
}

function getInitialFormState(initialRule) {
  if (!initialRule) {
    return { ...DEFAULT_FORM_STATE };
  }

  return {
    name: initialRule.name || '',
    team_id: initialRule.team_id === null || typeof initialRule.team_id === 'undefined'
      ? ''
      : String(initialRule.team_id),
    work_start_time: normalizeTimeValue(initialRule.work_start_time),
    work_end_time: normalizeTimeValue(initialRule.work_end_time),
    start_grace_minutes: String(initialRule.start_grace_minutes ?? 15),
    end_grace_minutes: String(initialRule.end_grace_minutes ?? 0),
    standard_work_hours: String(initialRule.standard_work_hours ?? 8),
    max_shift_hours: String(initialRule.max_shift_hours ?? 12),
  };
}

function validateRulePayload(payload) {
  if (!payload.name.trim()) {
    return 'Rule name is required.';
  }

  if (!payload.work_start_time || !payload.work_end_time) {
    return 'Work start and end time are required.';
  }

  const numericFields = [
    ['start_grace_minutes', 'Start grace'],
    ['end_grace_minutes', 'End grace'],
    ['standard_work_hours', 'Standard hours'],
    ['max_shift_hours', 'Max shift hours'],
  ];

  for (let index = 0; index < numericFields.length; index += 1) {
    const [field, label] = numericFields[index];
    const value = payload[field];

    if (!Number.isFinite(value) || value < 0) {
      return `${label} must be greater than or equal to 0.`;
    }
  }

  if (payload.max_shift_hours < payload.standard_work_hours) {
    return 'Max shift hours must be greater than or equal to standard hours.';
  }

  return '';
}

function RuleForm({ teams, initialRule, onSubmit, submitting, onCancelEdit }) {
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState('');
  const isEditing = Boolean(initialRule && initialRule.id);

  useEffect(() => {
    setFormData(getInitialFormState(initialRule));
    setFormError('');
  }, [initialRule]);

  const handleChange = (event) => {
    applyFieldChange({
      e: event,
      setData: setFormData,
      clearError: () => setFormError(''),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      team_id: formData.team_id === '' ? null : Number(formData.team_id),
      work_start_time: formData.work_start_time,
      work_end_time: formData.work_end_time,
      start_grace_minutes: Number(formData.start_grace_minutes),
      end_grace_minutes: Number(formData.end_grace_minutes),
      standard_work_hours: Number(formData.standard_work_hours),
      max_shift_hours: Number(formData.max_shift_hours),
    };

    const validationError = validateRulePayload(payload);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const wasSuccessful = await onSubmit(payload);
    if (wasSuccessful && !isEditing) {
      setFormData({ ...DEFAULT_FORM_STATE });
      setFormError('');
    }
  };

  return (
    <div className="tm-card tm-card-pad-md tm-w-full tm-form-card">
      <div className="tm-form-header">
        <h2 className="tm-form-title">{isEditing ? 'Edit rule' : 'Create rule'}</h2>
        <p className="tm-form-subtitle">
          {isEditing ? 'Update an existing business rule.' : 'Create a default or team-specific business rule.'}
        </p>
      </div>

      {formError && <div className="tm-form-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="tm-form">
        <div className="tm-form-field">
          <label htmlFor="rule-name">Name</label>
          <input
            id="rule-name"
            className="tm-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Rule name"
            required
            disabled={submitting}
          />
        </div>

        <div className="tm-form-field">
          <label htmlFor="rule-team">Team</label>
          <select
            id="rule-team"
            className="tm-input"
            name="team_id"
            value={formData.team_id}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="">Default (all teams)</option>
            {teams
              .filter((team) => team && team.id)
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
          </select>
        </div>

        <div className="tm-form-grid-2">
          <div className="tm-form-field">
            <label htmlFor="rule-start-time">Work start time</label>
            <input
              id="rule-start-time"
              className="tm-input"
              type="time"
              name="work_start_time"
              value={formData.work_start_time}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>

          <div className="tm-form-field">
            <label htmlFor="rule-end-time">Work end time</label>
            <input
              id="rule-end-time"
              className="tm-input"
              type="time"
              name="work_end_time"
              value={formData.work_end_time}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div className="tm-form-grid-2">
          <div className="tm-form-field">
            <label htmlFor="rule-start-grace">Start grace minutes</label>
            <input
              id="rule-start-grace"
              className="tm-input"
              type="number"
              name="start_grace_minutes"
              min="0"
              step="1"
              value={formData.start_grace_minutes}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="tm-form-field">
            <label htmlFor="rule-end-grace">End grace minutes</label>
            <input
              id="rule-end-grace"
              className="tm-input"
              type="number"
              name="end_grace_minutes"
              min="0"
              step="1"
              value={formData.end_grace_minutes}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="tm-form-grid-2">
          <div className="tm-form-field">
            <label htmlFor="rule-standard-hours">Standard hours</label>
            <input
              id="rule-standard-hours"
              className="tm-input"
              type="number"
              name="standard_work_hours"
              min="0"
              step="0.25"
              value={formData.standard_work_hours}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="tm-form-field">
            <label htmlFor="rule-max-hours">Max shift hours</label>
            <input
              id="rule-max-hours"
              className="tm-input"
              type="number"
              name="max_shift_hours"
              min="0"
              step="1"
              value={formData.max_shift_hours}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="tm-form-actions">
          {isEditing && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancelEdit}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button type="submit" className="tm-btn tm-btn-primary" disabled={submitting}>
            {submitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update rule' : 'Create rule')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RuleForm;
