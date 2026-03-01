export function getUserDisplayName(user) {
  return (
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    `User #${user?.id}`
  );
}

export function getUserSubtitle(user) {
  return user?.username || user?.email || '-';
}
