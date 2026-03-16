import { useMemo, useRef } from 'react';
import useDismissablePopover from '../../hooks/useDismissablePopover';
import { getUserDisplayName, getUserSubtitle } from '../../utils/userDisplay';

function AddMemberPicker({
  eligibleUsers,
  selectedUserId,
  setSelectedUserId,
  isOpen,
  setIsOpen,
  isPickerDisabled,
  isBusy,
  addingMember,
  onAdd,
}) {
  const pickerRef = useRef(null);

  useDismissablePopover(pickerRef, isOpen, () => setIsOpen(false));

  const selectedCandidate = useMemo(
    () => eligibleUsers.find((candidate) => String(candidate.id) === selectedUserId),
    [eligibleUsers, selectedUserId]
  );

  const selectedCandidateLabel = selectedCandidate ? getUserDisplayName(selectedCandidate) : 'Select user';

  return (
    <>
      <div className="team-add-member-row">
        <div className="team-add-member-label">Add member</div>
        <div className="tm-dropdown" ref={pickerRef}>
          <button
            type="button"
            className="tm-dropdown-trigger"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isPickerDisabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={selectedCandidate ? 'tm-dropdown-trigger-value' : 'tm-dropdown-trigger-placeholder'}>
              {selectedCandidateLabel}
            </span>
            <span className="tm-dropdown-chevron" aria-hidden="true">▾</span>
          </button>
          {isOpen && (
            <div className="tm-dropdown-panel" role="listbox">
              {eligibleUsers.map((candidate) => {
                const candidateId = String(candidate.id);
                return (
                  <button
                    key={candidateId}
                    type="button"
                    className={`tm-dropdown-item ${selectedUserId === candidateId ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedUserId(candidateId);
                      setIsOpen(false);
                    }}
                  >
                    <div className="tm-dropdown-name">{getUserDisplayName(candidate)}</div>
                    <div className="tm-dropdown-subtitle">{getUserSubtitle(candidate)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          className="tm-btn tm-btn-primary"
          onClick={onAdd}
          disabled={!selectedUserId || isBusy}
        >
          {addingMember ? 'Adding...' : 'Add'}
        </button>
      </div>
      {eligibleUsers.length === 0 && (
        <p className="team-add-member-empty">No eligible users to add.</p>
      )}
    </>
  );
}

export default AddMemberPicker;
