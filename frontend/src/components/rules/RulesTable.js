const EMPTY_VALUE = '\u2014';

function formatTimeValue(value) {
  if (!value) {
    return EMPTY_VALUE;
  }

  return String(value).slice(0, 5);
}

function formatNumberValue(value) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return EMPTY_VALUE;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return String(numericValue);
}

function RulesTable({ rules, teamsById, onEdit, onDelete }) {
  const safeRules = rules.filter((rule) => rule && rule.id);

  return (
    <div className="tm-card tm-card-scroll tm-w-full">
      <table className="tm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Scope</th>
            <th>Team</th>
            <th>Start</th>
            <th>End</th>
            <th>Grace In</th>
            <th>Grace Out</th>
            <th>Standard hours</th>
            <th><div className="tm-th-right">Actions</div></th>
          </tr>
        </thead>
        <tbody>
          {safeRules.length === 0 && (
            <tr>
              <td colSpan={9} className="tm-table-empty">
                No rules found.
              </td>
            </tr>
          )}

          {safeRules.map((rule) => {
            const isDefaultRule = rule.team_id === null || typeof rule.team_id === 'undefined';
            const team = isDefaultRule ? null : teamsById.get(Number(rule.team_id));
            const teamLabel = isDefaultRule ? EMPTY_VALUE : (team?.name || EMPTY_VALUE);

            return (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>{isDefaultRule ? 'Default' : 'Team'}</td>
                <td>{teamLabel}</td>
                <td>{formatTimeValue(rule.work_start_time)}</td>
                <td>{formatTimeValue(rule.work_end_time)}</td>
                <td>{formatNumberValue(rule.start_grace_minutes)}</td>
                <td>{formatNumberValue(rule.end_grace_minutes)}</td>
                <td>{formatNumberValue(rule.standard_work_hours)}</td>
                <td className="tm-cell-right">
                  <div className="tm-actions-wrap">
                    <button
                      type="button"
                      className="tm-btn tm-btn-primary"
                      onClick={() => onEdit(rule)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="tm-btn tm-btn-danger"
                      onClick={() => onDelete(rule.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RulesTable;
