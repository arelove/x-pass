/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

import React, { useState, useEffect, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { open } from '@tauri-apps/plugin-shell';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile} from '@tauri-apps/plugin-fs';
import { usePseudoModeContext } from '../context/PseudoModeContext';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  useTheme,
  Avatar,
  Button,
  Chip,
  InputAdornment,
  Fade,
  Zoom,
  Stack,
  alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import SortIcon from '@mui/icons-material/Sort';
import SettingsIcon from '@mui/icons-material/Settings';
import GitHubIcon from '@mui/icons-material/GitHub';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { SnackbarContext } from '../components/SnackbarProvider';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Entry {
  id: number;
  service: string;
  login: string;
  password: string;
  note: string;
}

const Vault: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const { isPseudoMode } = usePseudoModeContext();
  
  const [service, setService] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'service' | 'login' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterService, setFilterService] = useState<string>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [openMenu, setOpenMenu] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [importMerge, setImportMerge] = useState(true);
  const { showMessage } = useContext(SnackbarContext)!;
  const [importPassword, setImportPassword] = useState('');
const [backupPassword, setBackupPassword] = useState(''); 

  useEffect(() => {
    if (auth) {
      invoke<Entry[]>('get_entries', { userId: auth.user_id, encKey: auth.encKey })
        .then((fetchedEntries) => {
          setEntries(fetchedEntries);
          setFilteredEntries(fetchedEntries);
        })
        .catch((err) => {
          console.error('Failed to fetch entries:', err);
          showMessage(t('vault.fetchFailed'), 'error');
        });
    }
    const storedPics = localStorage.getItem('profilePics');
    if (storedPics) {
      setProfilePics(JSON.parse(storedPics));
    }
  }, [auth, t]);

  useEffect(() => {
    let result = [...entries];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.service.toLowerCase().includes(query) ||
          entry.login.toLowerCase().includes(query) ||
          entry.note.toLowerCase().includes(query)
      );
    }
    
    if (filterService !== 'all') {
      result = result.filter((entry) => entry.service === filterService);
    }
    
    if (sortField) {
      result.sort((a, b) => {
        const fieldA = a[sortField].toLowerCase();
        const fieldB = b[sortField].toLowerCase();
        if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredEntries(result);
  }, [entries, searchQuery, sortField, sortDirection, filterService]);

  const handleAdd = async () => {
    if (auth && service && login && password) {
      try {
        await invoke('add_entry', {
          userId: auth.user_id,
          service,
          login,
          password,
          note,
          encKey: auth.encKey,
        });
        const updated = await invoke<Entry[]>('get_entries', { userId: auth.user_id, encKey: auth.encKey });
        setEntries(updated);
        setOpenAdd(false);
        resetForm();
        showMessage(t('vault.addSuccess'), 'success');
      } catch (err) {
        showMessage(t('vault.addFailed'), 'error');
      }
    }
  };

  const handleEdit = async () => {
    if (auth && editEntry) {
      try {
        await invoke('update_entry', {
          entryId: editEntry.id,
          userId: auth.user_id,
          service,
          login,
          password,
          note,
          encKey: auth.encKey,
        });
        const updated = await invoke<Entry[]>('get_entries', { userId: auth.user_id, encKey: auth.encKey });
        setEntries(updated);
        setOpenEdit(false);
        resetForm();
        showMessage(t('vault.editSuccess'), 'success');
      } catch (err) {
        showMessage(t('vault.editFailed'), 'error');
      }
    }
  };

  const handleDelete = async (entryId: number) => {
    if (auth) {
      try {
        await invoke('delete_entry', { entryId, userId: auth.user_id });
        const updated = await invoke<Entry[]>('get_entries', { userId: auth.user_id, encKey: auth.encKey });
        setEntries(updated);
        setOpenDelete(false);
        showMessage(t('vault.deleteSuccess'), 'success');
      } catch (err) {
        showMessage(t('vault.deleteFailed'), 'error');
      }
    }
  };

  const handleCopy = (text: string) => {
    writeText(text)
      .then(() => showMessage(t('vault.copied'), 'success'))
      .catch((err) => console.error('Failed to copy:', err));
  };

  const handleExportToExcel = () => {
    const data = filteredEntries.map((entry, index) => ({
      '#': index + 1,
      Service: entry.service,
      Login: entry.login,
      Password: entry.password,
      Note: entry.note,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vault Entries');
    
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
    ];
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault_entries_${auth?.username || 'user'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage(t('vault.exportSuccess'), 'success');
  };

  const openEditDialog = (entry: Entry) => {
    setEditEntry(entry);
    setService(entry.service);
    setLogin(entry.login);
    setPassword(entry.password);
    setNote(entry.note);
    setOpenEdit(true);
  };

  const openDeleteDialog = (entryId: number) => {
    setDeleteEntryId(entryId);
    setOpenDelete(true);
  };

  const resetForm = () => {
    setService('');
    setLogin('');
    setPassword('');
    setNote('');
    setEditEntry(null);
  };

  const handleSort = (field: 'service' | 'login') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const togglePasswordVisibility = (entryId: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const uniqueServices = ['all', ...new Set(entries.map((entry) => entry.service))];

  // Экспорт в зашифрованный JSON
  const handleExportEncrypted = async () => {
    if (!auth) return;
    
    try {
      const backupJson = await invoke<string>('export_vault_encrypted', {
        userId: auth.user_id,
        username: auth.username,
        encKey: auth.encKey,
      });
      
      // Сохраняем файл
      const filePath = await save({
        defaultPath: `vault_backup_${auth.username}_${new Date().toISOString().split('T')[0]}.vaultbackup`,
        filters: [{
          name: 'Vault Backup',
          extensions: ['vaultbackup', 'json']
        }]
      });
      
      if (filePath) {
        await writeTextFile(filePath, backupJson);
        showMessage(t('vault.exportSuccess'), 'success');
      }
    } catch (err) {
      console.error('Export failed:', err);
      showMessage(t('vault.exportFailed'), 'error');
    }
  };

  // Импорт из файла
  const handleImport = async (file: File) => {
  if (!auth) return;
  
  try {
    const fileContent = await file.text();
    
    const importedCount = await invoke<number>('import_vault_with_password', {
      userId: auth.user_id,
      currentUserPassword: importPassword, 
      backupPassword: backupPassword, 
      backupJson: fileContent,
      merge: importMerge,
    });
    
    const updated = await invoke<Entry[]>('get_entries', {
      userId: auth.user_id,
      encKey: auth.encKey
    });
    setEntries(updated);
    
    setOpenImport(false);
    setImportPassword('');
    setBackupPassword('');
    showMessage(
      t('vault.importSuccess', { count: importedCount }),
      'success'
    );
  } catch (err) {
    console.error('Import failed:', err);
    showMessage(
      typeof err === 'string' ? err : t('vault.importFailed'),
      'error'
    );
  }
};

  const handleSettings = () => {
    navigate('/settings');
    setOpenMenu(false);
  };

  const handleLogout = () => {
    setAuth(null);
  };
  
  const handleGitHub = async () => {
    try {
      await open('https://github.com/arelove');
      setOpenMenu(false);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'transparent', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {t('vault.title')}
        </Typography>
        
        <Chip
          icon={<FilterListIcon />}
          label={`${filteredEntries.length} ${t('vault.entries')}`}
          
          size="medium"
          
          sx={{ 
            fontWeight: 600,
            px: 1,
            borderRadius: 2,
          }}
        />
    </Box>

<Paper
  elevation={0}
  sx={{
    p: 2,
    mb: 3,
    borderRadius: 3,
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  }}
>
  <Stack spacing={3}>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <Avatar
        sx={{
          width: 48,
          height: 48,
          bgcolor: auth?.username && profilePics[auth.username] ? 'transparent' : 'primary.main',
          border: '2px solid',
          borderColor: 'divider',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'scale(1.1)' }
        }}
        src={auth?.username ? profilePics[auth.username] : undefined}
        onClick={() => setOpenMenu(!openMenu)}
      >
        {auth?.username && !profilePics[auth.username] ? auth.username[0].toUpperCase() : null}
      </Avatar>
      <AnimatePresence>
             {openMenu && (
              <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 0.75 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: 10 * Math.cos((45 * Math.PI) / 180) + 30, 
                      left: 5 * Math.sin((45 * Math.PI) / 180) + 30, 
                      zIndex: 1300,
                    }}
                  >
                    <IconButton
                      onClick={handleLogout}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'rgba(161, 1, 1, 0.5)',
                        color: 'error.contrastText',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        '&:hover': {
                          bgcolor: 'rgba(142, 3, 3, 0.3)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        },
                      }}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 0.75 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    style={{
                      position: 'absolute',
                      top: 25 * Math.cos((130 * Math.PI) / 180) + 30,
                      left: 23 * Math.sin((90 * Math.PI) / 180) + 30, 
                      zIndex: 1300,
                    }}
                  >
                    <IconButton
                      onClick={handleSettings}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        },
                      }}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 0.75 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: 65 * Math.cos((135 * Math.PI) / 180) + 30,
                      left: 16 * Math.sin((135 * Math.PI) / 180) + 30, 
                      zIndex: 1300,
                    }}
                  >
                    <IconButton
                      onClick={handleGitHub}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'grey.700',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        '&:hover': {
                          bgcolor: 'grey.600',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        },
                      }}
                    >
                      <GitHubIcon fontSize="small" />
                    </IconButton>
                  </motion.div>

              </>
            )}
          </AnimatePresence>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {!isPseudoMode && (
                <Tooltip title={t('vault.addEntry')}>
                  <IconButton
                    onClick={() => setOpenAdd(true)}
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      borderRadius: 2,
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
      
      <Tooltip title={t('vault.exportEncrypted')}>
        <IconButton
          onClick={handleExportEncrypted}
          sx={{ borderRadius: 2, color: 'text.primary' }}
        >
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title={t('vault.import')}>
        <IconButton
          onClick={() => setOpenImport(true)}
          sx={{ borderRadius: 2, color: 'text.primary' }}
        >
          <FileUploadIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title={t('vault.exportExcel')}>
        <IconButton
          onClick={handleExportToExcel}
          sx={{ borderRadius: 2, color: 'text.primary' }}
        >
          <DescriptionIcon />
        </IconButton>
      </Tooltip>
    </Box>
    </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap'}}>
            <TextField
              placeholder={t('vault.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 70 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('vault.filterService')}</InputLabel>
              <Select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                label={t('vault.filterService')}
              >
                {uniqueServices.map((service) => (
                  <MenuItem key={service} value={service}>
                    {service === 'all' ? t('vault.allServices') : service}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('vault.service')}
                  <IconButton size="small" onClick={() => handleSort('service')}>
                    <SortIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('vault.login')}
                  <IconButton size="small" onClick={() => handleSort('login')}>
                    <SortIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('vault.password')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('vault.note')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('vault.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {filteredEntries.map((entry, index) => (
                <TableRow
                  key={entry.id}
                  component={motion.tr}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  sx={{
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Chip label={entry.service} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{entry.login}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {visiblePasswords.has(entry.id) ? entry.password : '••••••••'}
                      <IconButton
                        size="small"
                        onClick={() => togglePasswordVisibility(entry.id)}
                      >
                        {visiblePasswords.has(entry.id) ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.note}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={t('vault.copy')}>
                        <IconButton size="small" onClick={() => handleCopy(entry.password)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('vault.edit')}>
                        <IconButton size="small" onClick={() => openEditDialog(entry)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('vault.delete')}>
                        <IconButton size="small" onClick={() => openDeleteDialog(entry.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
        
        {filteredEntries.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('vault.noEntries')}
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openAdd || openEdit}
        onClose={() => { setOpenAdd(false); setOpenEdit(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {openEdit ? t('vault.editEntry') : t('vault.addEntry')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('vault.service')}
              value={service}
              onChange={(e) => setService(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t('vault.login')}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t('vault.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              type="password"
            />
            <TextField
              label={t('vault.note')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button  onClick={() => { setOpenAdd(false); setOpenEdit(false); resetForm(); }}>
            {t('vault.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={openEdit ? handleEdit : handleAdd}
            disabled={!service || !login || !password}
          >
            {openEdit ? t('vault.save') : t('vault.add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        TransitionComponent={Fade}
      >
        <DialogTitle>{t('vault.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('vault.deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} sx={{ color: 'text.primary' }}>
            {t('vault.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteEntryId !== null && handleDelete(deleteEntryId)}
          >
            {t('vault.delete')}
          </Button>
        </DialogActions>
      </Dialog>

     <Dialog open={openImport} onClose={() => setOpenImport(false)} maxWidth="sm" fullWidth TransitionComponent={Zoom}>
  <DialogTitle sx={{ fontWeight: 600 }}>
    {t('vault.importTitle')}
  </DialogTitle>
  <DialogContent>
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {t('vault.importDescription')}
      </Typography>
      
      <TextField
        label={t('vault.currentPassword')}
        type="password"
        value={importPassword}
        onChange={(e) => setImportPassword(e.target.value)}
        fullWidth
        required
        helperText={t('vault.currentPasswordHelp')}
      />
      
      <TextField
        label={t('vault.backupPassword')}
        type="password"
        value={backupPassword}
        onChange={(e) => setBackupPassword(e.target.value)}
        fullWidth
        required
        helperText={t('vault.backupPasswordHelp')}
      />
      
      <FormControl>
        <InputLabel>{t('vault.importMode')}</InputLabel>
        <Select
          value={importMerge ? 'merge' : 'replace'}
          onChange={(e) => setImportMerge(e.target.value === 'merge')}
          label={t('vault.importMode')}
        >
          <MenuItem value="merge">
            <Box>
              <Typography variant="body1">{t('vault.mergeMode')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('vault.mergeModeDesc')}
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem value="replace">
            <Box>
              <Typography variant="body1">{t('vault.replaceMode')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('vault.replaceModeDesc')}
              </Typography>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
      
      <Button
        variant="outlined"
        component="label"
        startIcon={<FileUploadIcon />}
        fullWidth
        sx={{ p: 2 }}
        disabled={!importPassword || !backupPassword}
      >
        {t('vault.selectBackupFile')}
        <input
          type="file"
          hidden
          accept=".vaultbackup,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
      </Button>
    </Stack>
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button onClick={() => {
      setOpenImport(false);
      setImportPassword('');
      setBackupPassword('');
    }}>
      {t('vault.cancel')}
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
};

export default Vault;