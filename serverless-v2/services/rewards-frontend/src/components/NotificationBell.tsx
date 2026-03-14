import { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  useGetNotificationsQuery,
  useDismissNotificationMutation,
} from '../api/rewardsApi';

const TYPE_COLORS: Record<string, 'success' | 'error' | 'info'> = {
  tier_upgrade: 'success',
  tier_downgrade: 'error',
  milestone: 'info',
};

const TYPE_LABELS: Record<string, string> = {
  tier_upgrade: 'Upgrade',
  tier_downgrade: 'Downgrade',
  milestone: 'Milestone',
};

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data } = useGetNotificationsQuery({ unread: false });
  const [dismiss] = useDismissNotificationMutation();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  const handleDismiss = async (notificationId: string) => {
    await dismiss(notificationId);
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="large"
      >
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 380, maxHeight: 450, bgcolor: 'background.paper' },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} unread`} color="secondary" size="small" />
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 350, overflow: 'auto' }}>
            {notifications.map((n) => (
              <ListItem
                key={n.notificationId}
                sx={{
                  bgcolor: n.isRead ? 'transparent' : 'rgba(108, 99, 255, 0.08)',
                  borderLeft: n.isRead ? 'none' : '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight={n.isRead ? 400 : 600}>
                        {n.title}
                      </Typography>
                      <Chip
                        label={TYPE_LABELS[n.type] || n.type}
                        size="small"
                        color={TYPE_COLORS[n.type] || 'default'}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {n.message}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary" component="span">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
                {!n.isRead && (
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleDismiss(n.notificationId)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Read
                    </Button>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
