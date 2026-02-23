import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useData from '../hooks/useData';
import tokenService from '../services/tokenService';
import { isManagerRole } from '../utils/roles';
import usersService from '../services/users.service';
import teamsService from '../services/teams.service';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import TeamForm from '../components/TeamForm';
import KeyIndicators from '../components/KeyIndicators';
import TeamOverview from '../components/TeamOverview';
import UsersSection from '../components/UsersSection';
import TeamsSection from '../components/TeamsSection';
import ClocksSection from '../components/ClocksSection';
import ReportsSection from '../components/ReportsSection';
import AdvancedKPIs from '../components/AdvancedKPIs';
import './Data.css';

function Data() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const [user, setUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { users, teams, clocks, reports, kpiData, loading, error } = useData(refreshTrigger);

  const kpis = kpiData?.userKpis || {
    totalShifts: 0,
    averageShiftLength: 0,
    longestShift: 0,
    shortestShift: 0,
    latenessRate: 0,
    weeklyAverage: 0,
    mostActiveDay: 'N/A',
    onTimeRate: 0,
    earlyDepartureRate: 0,
    overtimeHours: 0,
    scheduleComplianceRate: 0,
    averageArrivalTime: 'N/A',
    averageDepartureTime: 'N/A',
    totalWorkingHours: 0,
    expectedHours: 0,
    hoursVariance: 0,
  };

  const chartData = kpiData?.chartData || {
    monthlyHours: [],
    attendanceTrend: [],
    productivityScore: 0,
    userHours: [],
  };

  useEffect(() => {
    const userData = tokenService.getUser();
    if (userData) {
      setUser(userData);
    }
  }, [navigate]);

  const handleCreateUser = async (formData) => {
    if (!isManager) {
      setFormError('Only managers can create or edit users');
      return;
    }

    setUserFormLoading(true);
    setFormError('');

    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, formData);
      } else {
        await usersService.createUser(formData);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setUserFormLoading(false);
    }
  };

  const confirmAndDelete = async ({ confirmMessage, action, onSuccess }) => {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await action();
      onSuccess();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = (userId) => {
    if (!isManager) {
      setFormError('Only managers can delete users');
      return;
    }

    confirmAndDelete({
      confirmMessage: 'Are you sure you want to delete this user?',
      action: () => usersService.deleteUser(userId),
      onSuccess: () => setRefreshTrigger(prev => prev + 1),
    });
  };

  const handleCreateTeam = async (formData) => {
    if (!isManager) {
      setFormError('Only managers can create or edit teams');
      return;
    }

    setTeamFormLoading(true);
    setFormError('');

    try {
      let teamId;
      if (editingTeam) {
        await teamsService.updateTeam(editingTeam.id, { 
          name: formData.name,
          description: formData.description,
          manager_id: formData.manager_id
        });
        teamId = editingTeam.id;
      } else {
        const newTeam = await teamsService.createTeam({
          name: formData.name,
          description: formData.description,
          manager_id: formData.manager_id
        });
        teamId = newTeam.id;
      }

      if (formData.userIds && formData.userIds.length > 0) {
        await teamsService.updateTeamMembers(teamId, formData.userIds);
      }

      setShowTeamModal(false);
      setEditingTeam(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setTeamFormLoading(false);
    }
  };

  const handleDeleteTeam = (teamId) => {
    if (!isManager) {
      setFormError('Only managers can delete teams');
      return;
    }

    confirmAndDelete({
      confirmMessage: 'Are you sure you want to delete this team?',
      action: () => teamsService.deleteTeam(teamId),
      onSuccess: () => setRefreshTrigger(prev => prev + 1),
    });
  };

  if (!user) return null;

  const isManager = isManagerRole(user);
  const teamName = isManager
    ? (kpiData?.teamOverview?.teamName || (teams.length > 0 ? teams[0].name : 'No team'))
    : null;

  const employeeStats = isManager ? (kpiData?.teamOverview?.employeeStats || []) : [];
  const globalStats = isManager ? (kpiData?.teamOverview?.globalStats || {
    totalEmployees: 0,
    currentlyClockedIn: 0,
    avgLateRate: '0.0',
    employeesWithIssues: 0,
  }) : null;

  return (
    <div className="dashboard tm-shell">
      <div className="tm-hero" style={{ backgroundImage: `url(${backgroundUrl})` }} aria-hidden="true" />
      <Sidebar user={user} onLogout={logout} />
      
      <div className="dashboard-content tm-panel">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">Data Dashboard</h1>
            <p className="dashboard-subtitle">View and manage your time tracking data.</p>
          </div>
          <button onClick={() => navigate('/home')} className="btn-secondary">
            Back to Home
          </button>
        </header>

        {loading && <div className="loading">Loading data...</div>}
        {error && <div className="error">{error}</div>}
        {formError && <div className="error">{formError}</div>}

        {!loading && !error && (
          <>
            {isManager && (
              <TeamOverview 
                teamName={teamName}
                employeeStats={employeeStats}
                globalStats={globalStats}
              />
            )}

            <KeyIndicators chartData={chartData} />

            {isManager && (
              <UsersSection
                users={users}
                currentUser={user}
                isManager={isManager}
                onEditUser={(u) => { setEditingUser(u); setShowUserModal(true); }}
                onDeleteUser={handleDeleteUser}
                onAddUser={() => { setEditingUser(null); setShowUserModal(true); }}
              />
            )}

            {isManager && (
              <TeamsSection
                teams={teams}
                isManager={isManager}
                onEditTeam={(t) => { setEditingTeam(t); setShowTeamModal(true); }}
                onDeleteTeam={handleDeleteTeam}
                onAddTeam={() => { setEditingTeam(null); setShowTeamModal(true); }}
              />
            )}

            <ClocksSection clocks={clocks} />

            <ReportsSection reports={reports} />

            <AdvancedKPIs kpis={kpis} />
          </>
        )}
      </div>

      <Modal
        isOpen={showUserModal}
        title={editingUser ? 'Edit User' : 'Create New User'}
        onClose={() => { setShowUserModal(false); setEditingUser(null); }}
        onSubmit={handleCreateUser}
        hideSubmitButton={true}
      >
        <UserForm 
          user={editingUser} 
          onSubmit={handleCreateUser}
          loading={userFormLoading}
        />
      </Modal>

      <Modal
        isOpen={showTeamModal}
        title={editingTeam ? 'Edit Team' : 'Create New Team'}
        onClose={() => { setShowTeamModal(false); setEditingTeam(null); }}
        onSubmit={handleCreateTeam}
      >
        <TeamForm 
          team={editingTeam} 
          users={users}
          onSubmit={handleCreateTeam}
          loading={teamFormLoading}
        />
      </Modal>
    </div>
  );
}

export default Data;
