import { useCallback, useEffect, useMemo, useState } from 'react';
import InlineState from '../components/InlineState';
import PageHeader from '../components/PageHeader';
import RuleForm from '../components/rules/RuleForm';
import RulesTable from '../components/rules/RulesTable';
import teamsService from '../services/teams.service';
import timeRulesService from '../services/timeRules.service';
import { getApiErrorMessage } from '../utils/apiError';
import { getArrayData } from '../utils/arrayData';

function RulesPage() {
  const [rules, setRules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const teamsById = useMemo(() => (
    new Map(
      teams
        .filter((team) => team && team.id)
        .map((team) => [Number(team.id), team])
    )
  ), [teams]);

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [teamsResponse, rulesResponse] = await Promise.all([
        teamsService.getTeams(),
        timeRulesService.listRules(),
      ]);

      setTeams(getArrayData(teamsResponse.data));
      setRules(getArrayData(rulesResponse.data));
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load rules'));
      setTeams([]);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRules = useCallback(async () => {
    const rulesResponse = await timeRulesService.listRules();
    setRules(getArrayData(rulesResponse.data));
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleRuleSubmit = useCallback(async (payload) => {
    setSubmitting(true);
    setActionError('');

    try {
      if (editingRule) {
        await timeRulesService.updateRule(editingRule.id, payload);
      } else {
        await timeRulesService.createRule(payload);
      }

      await refreshRules();
      setEditingRule(null);
      return true;
    } catch (error) {
      setActionError(getApiErrorMessage(error, editingRule ? 'Failed to update rule' : 'Failed to create rule'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [editingRule, refreshRules]);

  const handleDeleteRule = useCallback(async (ruleId) => {
    const confirmed = window.confirm('Delete this rule?');
    if (!confirmed) {
      return;
    }

    setActionError('');

    try {
      await timeRulesService.deleteRule(ruleId);
      await refreshRules();
      if (editingRule?.id === ruleId) {
        setEditingRule(null);
      }
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Failed to delete rule'));
    }
  }, [editingRule, refreshRules]);

  return (
    <>
      <PageHeader
        title="Business rules"
        subtitle="Manage default schedules and team-specific overrides."
      />

      {actionError && <div className="error tm-page-error">{actionError}</div>}

      <InlineState loading={loading} loadingText="Loading rules..." error={loadError}>
        <div className="tm-split">
          <section className="tm-split-main">
            <RulesTable
              rules={rules}
              teamsById={teamsById}
              onEdit={setEditingRule}
              onDelete={handleDeleteRule}
            />
          </section>

          <section className="tm-split-side">
            <RuleForm
              teams={teams}
              initialRule={editingRule}
              onSubmit={handleRuleSubmit}
              submitting={submitting}
              onCancelEdit={() => {
                setEditingRule(null);
                setActionError('');
              }}
            />
          </section>
        </div>
      </InlineState>
    </>
  );
}

export default RulesPage;
