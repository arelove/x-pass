/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
// SettingsPage/dialogs/ActivityDialogs.tsx

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  TablePagination,
  Box,
  Stack,
  Card,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import { useTranslation } from 'react-i18next';
import { ActivityLog, ActivityStats, ActivityTrend, CHART_COLORS } from '../types';
import SmoothScrollContainer from '../../../components/SmoothScrollbar';

interface ActivityDialogsProps {
  openActivityDialog: boolean;
  onCloseActivityDialog: () => void;
  paginatedLogs: ActivityLog[];
  totalLogs: number;
  page: number;
  rowsPerPage: number;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openStatsDialog: boolean;
  onCloseStatsDialog: () => void;
  activityStats: ActivityStats | null;
  activityTrend: ActivityTrend[];
  trendDays: number;
  onTrendDaysChange: (days: number) => void;
  onOpenChart: (chartType: 'line' | 'pie' | 'bar') => void;
  onExportLogs: () => void;
  onClearLogs: () => void;
  onOpenPhotosDialog: () => void;
  openChartDialog: boolean;
  onCloseChartDialog: () => void;
  selectedChart: 'line' | 'pie' | 'bar' | null;
  openDeleteLogsDialog: boolean;
  onCloseDeleteLogsDialog: () => void;
  deleteDialogPassword: string;
  onDeleteDialogPasswordChange: (password: string) => void;
  onScheduleLogsDeletion: () => void;
}

type SortField = 'timestamp' | 'action_type' | 'details';
type SortOrder = 'asc' | 'desc';

export const ActivityDialogs: React.FC<ActivityDialogsProps> = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

  const getActivityIcon = (actionType: string) => {
    const iconProps = { fontSize: 'small' as const };
    switch (actionType) {
      case 'login': return <LoginIcon color="success" {...iconProps} />;
      case 'logout': return <LogoutIcon color="error" {...iconProps} />;
      case 'add_entry': return <AddIcon color="primary" {...iconProps} />;
      case 'edit_entry': return <EditIcon color="info" {...iconProps} />;
      case 'delete_entry': return <DeleteIcon color="error" {...iconProps} />;
      case 'view_entry': return <VisibilityIcon color="action" {...iconProps} />;
      case 'account_created': return <PersonIcon color="success" {...iconProps} />;
      case 'account_deleted': return <DeleteIcon color="error" {...iconProps} />;
      case 'login_failed': return <CloseIcon color="error" {...iconProps} />;
      case 'pseudo_login_access': return <SecurityIcon color="warning" {...iconProps} />;
      case 'vault_exported': return <FileDownloadIcon color="success" {...iconProps} />;
      case 'vault_imported': return <FileUploadIcon color="success" {...iconProps} />;
      case 'pseudo_password_added': return <VpnKeyIcon color="warning" {...iconProps} />;
      case 'pseudo_mode_settings_updated': return <SettingsIcon color="info" {...iconProps} />;
      default: return <HistoryIcon {...iconProps} />;
    }
  };

  const getActionTypeColor = (actionType: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    if (actionType.includes('login') && !actionType.includes('failed')) return 'success';
    if (actionType.includes('delete') || actionType.includes('failed')) return 'error';
    if (actionType.includes('pseudo')) return 'warning';
    if (actionType.includes('edit') || actionType.includes('update')) return 'info';
    return 'default';
  };

  const uniqueActionTypes = useMemo(() => {
    const types = new Set(props.paginatedLogs.map(log => log.action_type));
    return Array.from(types).sort();
  }, [props.paginatedLogs]);

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...props.paginatedLogs];

    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionTypeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.action_type.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        new Date(log.timestamp).toLocaleString().toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'action_type':
          comparison = a.action_type.localeCompare(b.action_type);
          break;
        case 'details':
          comparison = a.details.localeCompare(b.details);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [props.paginatedLogs, searchQuery, actionTypeFilter, sortField, sortOrder]);

  const displayedLogs = useMemo(() => {
    return filteredAndSortedLogs.slice(
      localPage * localRowsPerPage, 
      localPage * localRowsPerPage + localRowsPerPage
    );
  }, [filteredAndSortedLogs, localPage, localRowsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActionTypeFilter('all');
    setSortField('timestamp');
    setSortOrder('desc');
    setLocalPage(0);
  };

  const handleLocalChangePage = (_: unknown, newPage: number) => {
    setLocalPage(newPage);
  };

  const handleLocalChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalRowsPerPage(parseInt(event.target.value, 10));
    setLocalPage(0);
  };


  return (
    <>
      {/* Activity Log Dialog */}
      <Dialog 
        open={props.openActivityDialog} 
        onClose={props.onCloseActivityDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                {t('settings.activityLog')}
              </Typography>
              <Chip 
                label={filteredAndSortedLogs.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title={t('settings.exportLogs')}>
                <IconButton
                  onClick={props.onExportLogs}
                  size="small"
                  sx={{
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={props.onCloseActivityDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          <Stack spacing={2} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                placeholder={t('settings.searchLogs') || 'Search logs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">{t('settings.allActions') || 'All actions'}</MenuItem>
                  {uniqueActionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getActivityIcon(type)}
                        <Typography variant="body2">
                          {t(`settings.activity.${type}`)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {(searchQuery || actionTypeFilter !== 'all') && (
                <Tooltip title={t('settings.clearFilters') || 'Clear filters'}>
                  <IconButton onClick={handleClearFilters} size="small" color="error">
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
            
          <TableContainer sx={{ maxHeight: 500, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 , overflow: 'hidden'}}>
            <SmoothScrollContainer height="40vh">

              <Table stickyHeader size="small"sx={{
                tableLayout: 'fixed',          
                minWidth: '100%'               
              }}>
               
             <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 70, fontWeight: 600, bgcolor: 'background.paper' }}>
                    {t('settings.icon') || 'Icon'}
                  </TableCell>
                  <TableCell sx={{ width: 200, fontWeight: 600, bgcolor: 'background.paper' }}>
                    <TableSortLabel
                      active={sortField === 'action_type'}
                      direction={sortField === 'action_type' ? sortOrder : 'asc'}
                      onClick={() => handleSort('action_type')}
                    >
                      {t('settings.actionType') || 'Action Type'}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 200, fontWeight: 600, bgcolor: 'background.paper' }}>
                    <TableSortLabel
                      active={sortField === 'details'}
                      direction={sortField === 'details' ? sortOrder : 'asc'}
                      onClick={() => handleSort('details')}
                    >
                      {t('settings.details') || 'Details'}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 200, fontWeight: 600, bgcolor: 'background.paper' }}>
                    <TableSortLabel
                      active={sortField === 'timestamp'}
                      direction={sortField === 'timestamp' ? sortOrder : 'asc'}
                      onClick={() => handleSort('timestamp')}
                    >
                      {t('settings.timestamp') || 'Timestamp'}
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
             
              <TableBody>
                {displayedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('settings.noLogsFound') || 'No logs found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedLogs.map((log) => (
                    <TableRow 
                      key={log.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          {getActivityIcon(log.action_type)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`settings.activity.${log.action_type}`)}
                          size="small"
                          color={getActionTypeColor(log.action_type)}
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.details}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              
            </Table>
            </SmoothScrollContainer>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredAndSortedLogs.length}
            page={localPage}
            onPageChange={handleLocalChangePage}
            rowsPerPage={localRowsPerPage}
            onRowsPerPageChange={handleLocalChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage={t('settings.rowsPerPage')}
            sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
          />
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog
        open={props.openStatsDialog}
        onClose={props.onCloseStatsDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700}>
                {t('settings.activityStatistics')}
              </Typography>
            </Box>
            <IconButton onClick={props.onCloseStatsDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {props.activityStats && (
            <>
              {/* Overview Cards */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2, p: 1.5 }}>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {props.activityStats.total_logins}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.totalLogins')}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2, p: 1.5 }}>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {props.activityStats.total_actions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.totalActions')}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2, p: 1.5 }}>
                    <Typography variant="body2" fontWeight={600} color="info.main" noWrap>
                      {props.activityStats.last_login ? new Date(props.activityStats.last_login).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.lastLogin')}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2, p: 1.5 }}>
                    <Typography variant="body2" fontWeight={600} color="warning.main" noWrap>
                      {props.activityStats.most_active_day ? new Date(props.activityStats.most_active_day).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.mostActiveDay')}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Compact Charts */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 6 }}>
                  <Card 
                    sx={{ 
                      borderRadius: 2, 
                      p: 1.5,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                    }}
                    onClick={() => props.onOpenChart('line')}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t('settings.activityTrend')}
                      </Typography>
                      <Tooltip title={t('settings.clickToEnlarge')}>
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ height: 150 }}>
                      <Line
                        id="lineChartCanvas"
                        data={{
                          labels: props.activityTrend.slice(-7).map(t => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
                          datasets: [{
                            data: props.activityTrend.slice(-7).map(t => t.count),
                            borderColor: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            tension: 0.4,
                            fill: true,
                            pointRadius: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { enabled: false } },
                          scales: {
                            x: { ticks: { display: false }, grid: { display: false } },
                            y: { ticks: { display: false }, grid: { color: alpha(theme.palette.divider, 0.1) } }
                          }
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 6, md: 6 }}>
                  <Card 
                    sx={{ 
                      borderRadius: 2, 
                      p: 1.5,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                    }}
                    onClick={() => props.onOpenChart('pie')}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t('settings.actionsByType')}
                      </Typography>
                      <Tooltip title={t('settings.clickToEnlarge')}>
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pie
                        id="pieChartCanvas"
                        data={{
                          labels: props.activityStats.actions_by_type.map(a => t(`settings.activity.${a.action_type}`)),
                          datasets: [{
                            data: props.activityStats.actions_by_type.map(a => a.count),
                            backgroundColor: CHART_COLORS,
                            borderColor: theme.palette.background.paper,
                            borderWidth: 2,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { enabled: false } }
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card 
                    sx={{ 
                      borderRadius: 2, 
                      p: 1.5,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                    }}
                    onClick={() => props.onOpenChart('bar')}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t('settings.actionsBreakdown')}
                      </Typography>
                      <Tooltip title={t('settings.clickToEnlarge')}>
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ height: 120 }}>
                      <Bar
                        id="barChartCanvas"
                        data={{
                          labels: props.activityStats.actions_by_type.map(a => t(`settings.activity.${a.action_type}`)),
                          datasets: [{
                            data: props.activityStats.actions_by_type.map(a => a.count),
                            backgroundColor: props.activityStats.actions_by_type.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                            borderRadius: 6,
                            borderSkipped: false,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { enabled: false } },
                          scales: {
                            x: { ticks: { font: { size: 9 }, color: theme.palette.text.secondary }, grid: { display: false } },
                            y: { ticks: { display: false }, grid: { color: alpha(theme.palette.divider, 0.1) } }
                          }
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }} flexWrap="wrap">
                <Tooltip title={t('settings.viewFailedPhotos')}>
                  <IconButton onClick={props.onOpenPhotosDialog}>
                    <CameraAltIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  color="error"
                  onClick={props.onClearLogs}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enlarged Chart Dialog */}
      <Dialog
        open={props.openChartDialog}
        onClose={props.onCloseChartDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          {props.selectedChart === 'line' && props.activityStats && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.activityTrend')}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={props.trendDays}
                      onChange={(e) => props.onTrendDaysChange(Number(e.target.value))}
                    >
                      <MenuItem value={7}>7 {t('settings.days')}</MenuItem>
                      <MenuItem value={30}>30 {t('settings.days')}</MenuItem>
                      <MenuItem value={90}>90 {t('settings.days')}</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={props.onCloseChartDialog} size="small">
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ height: 500 }}>
                <Line
                  data={{
                    labels: props.activityTrend.map(t => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
                    datasets: [{
                      label: t('settings.actions'),
                      data: props.activityTrend.map(t => t.count),
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, position: 'top', labels: { color: theme.palette.text.primary, font: { size: 14 } } },
                      tooltip: {
                        backgroundColor: theme.palette.background.paper,
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                      }
                    },
                    scales: {
                      x: { ticks: { color: theme.palette.text.secondary }, grid: { color: alpha(theme.palette.divider, 0.1) } },
                      y: { ticks: { color: theme.palette.text.secondary }, grid: { color: alpha(theme.palette.divider, 0.1) } }
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {props.selectedChart === 'pie' && props.activityStats && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.actionsByType')}
                </Typography>
                <IconButton onClick={props.onCloseChartDialog} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pie
                  data={{
                    labels: props.activityStats.actions_by_type.map(a => t(`settings.activity.${a.action_type}`)),
                    datasets: [{
                      data: props.activityStats.actions_by_type.map(a => a.count),
                      backgroundColor: CHART_COLORS,
                      borderColor: theme.palette.background.paper,
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'right',
                        labels: { color: theme.palette.text.primary, font: { size: 14 }, padding: 15, boxWidth: 15 }
                      },
                      tooltip: {
                        backgroundColor: theme.palette.background.paper,
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {props.selectedChart === 'bar' && props.activityStats && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.actionsBreakdown')}
                </Typography>
                <IconButton onClick={props.onCloseChartDialog} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: 500 }}>
                <Bar
                  data={{
                    labels: props.activityStats.actions_by_type.map(a => t(`settings.activity.${a.action_type}`)),
                    datasets: [{
                      label: t('settings.count'),
                      data: props.activityStats.actions_by_type.map(a => a.count),
                      backgroundColor: props.activityStats.actions_by_type.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                      borderRadius: 8,
                      borderSkipped: false,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: theme.palette.background.paper,
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                      }
                    },
                    scales: {
                      x: { ticks: { color: theme.palette.text.secondary, font: { size: 12 } }, grid: { display: false } },
                      y: { ticks: { color: theme.palette.text.secondary }, grid: { color: alpha(theme.palette.divider, 0.1) } }
                    }
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Logs Confirmation Dialog */}
      <Dialog open={props.openDeleteLogsDialog} onClose={props.onCloseDeleteLogsDialog} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              {t('settings.confirmLogsDeletion')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.logsDeletionWarning')}
            </Typography>
            <TextField
              label={t('settings.masterPassword')}
              type="password"
              value={props.deleteDialogPassword}
              onChange={(e) => props.onDeleteDialogPasswordChange(e.target.value)}
              fullWidth
              onKeyPress={(e) => e.key === 'Enter' && props.onScheduleLogsDeletion()}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={props.onCloseDeleteLogsDialog} sx={{color:'text.primary'}}>
                {t('settings.cancel')}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={props.onScheduleLogsDeletion}
                disabled={!props.deleteDialogPassword}
              >
                {t('settings.schedule')}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};
